package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	initdata "github.com/telegram-mini-apps/init-data-golang"
	_ "modernc.org/sqlite"
)

var db *sql.DB

// go требует чтоб ключ контекста был структурой
type contextKey string

// просто название ключа используемого в контексте
const userIDKey contextKey = "userID"

type TrainingData struct {
	TrainingId int            `json:"trainingId,omitempty"`
	Exercises  []ExerciseData `json:"exercises"`
	Date       string         `json:"date"`
}

type ExerciseData struct {
	ExerciseId   int       `json:"exerciseId,omitempty"`
	BaseExercise int       `json:"baseExercise"`
	Sets         []SetData `json:"sets"`
}

type SetData struct {
	SetId  int     `json:"setId,omitempty"`
	Weight float32 `json:"weight"`
	Reps   int     `json:"reps"`
	Rpe    int     `json:"rpe"`
	Note   string  `json:"note,omitempty"`
}

func validateAndGetUserId(rawInitData string) (int64, error) {
	fmt.Println(rawInitData)
	token := os.Getenv("TG_BOT_TOKEN")
	if token == "" {
		return 0, errors.New("не нашел токен бота")
	}
	expIn := 12 * time.Hour

	err := initdata.Validate(rawInitData, token, expIn)
	if err != nil {
		return 0, err
	}
	parsedData, err := initdata.Parse(rawInitData)
	if err != nil {
		return 0, err
	}
	return parsedData.User.ID, nil

}

func insertTrainingData(ctx context.Context, trainingData TrainingData) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	// _, err = tx.ExecContext(ctx, "INSERT INTO users (user_id) VALUES (?)", 1)
	// if err != nil {
	// 	return err
	// }
	result, err := tx.ExecContext(ctx, "INSERT INTO trainings (user_id, date) VALUES (?, ?)", ctx.Value(userIDKey), trainingData.Date)
	if err != nil {
		return err
	}
	trainingId, err := result.LastInsertId()
	if err != nil {
		return err
	}
	for _, exercise := range trainingData.Exercises {
		result, err = tx.ExecContext(ctx, "INSERT INTO exercises (base_exercise, training_id) VALUES (?, ?)", exercise.BaseExercise, trainingId)
		if err != nil {
			return err
		}
		exerciseId, err := result.LastInsertId()
		if err != nil {
			return err
		}
		for _, set := range exercise.Sets {
			_, err = tx.ExecContext(ctx, "INSERT INTO sets (exercise_id, reps, weight, rpe, note) VALUES (?, ?, ?, ?, ?)", exerciseId, set.Reps, set.Weight, set.Rpe, set.Note)
			if err != nil {
				return err
			}
		}
	}
	err = tx.Commit()
	if err != nil {
		return err
	}
	return nil
}

func sendResponse(w http.ResponseWriter, statusCode int, data map[string]string) {
	encoder := json.NewEncoder(w)
	w.WriteHeader(int(statusCode))
	err := encoder.Encode(data)
	if err != nil {
		fmt.Printf("Не смог записать в json %v\n", err)
	}
}

// мидлвейр выполняет передаваемую функцию next, но с модифицированным запросом
// (добавляет к нему контекст с userId пользователя, и хендлер уже знает его и уверен что пользователь залогинен)
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	// мидлвейр передается в HandlerFunc. в HandlerFunc выполняется middleware, в который аргументом передается моя функция-хендлер
	// миддлвейр в свою очередь сразу же возвращает анонимную функцию, внутри которой проходит валидация и
	// вызывается мой хендлер с модифицированным запросом, которую позже вызовет HandlerFunc когда придет запрос на роут
	return func(w http.ResponseWriter, r *http.Request) {
		responseData := map[string]string{
			"error": "Invalid authorization token",
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			sendResponse(w, http.StatusUnauthorized, responseData)
			return
		}
		authParts := strings.Split(authHeader, " ")
		if len(authParts) != 2 {
			sendResponse(w, http.StatusUnauthorized, responseData)
			return
		}
		authType := authParts[0]
		authData := authParts[1]
		if authType != "tma" {
			sendResponse(w, http.StatusUnauthorized, responseData)
			return
		}
		userId, err := validateAndGetUserId(authData)
		if err != nil {
			responseData["error"] = err.Error()
			sendResponse(w, http.StatusUnauthorized, responseData)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, userId)
		next(w, r.WithContext(ctx))

	}
}

// TODO: валидация json: чтобы нельзя было отправить 999 повторений и тд. можно использовать http.MaxBytesReader чтбоы не читать больше определенного объема
func addTrainingHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Получил запрос")

	responseData := map[string]string{
		"status": "ok",
	}
	trainingData := TrainingData{}

	decoder := json.NewDecoder(r.Body)
	encoder := json.NewEncoder(w)

	err := decoder.Decode(&trainingData)
	if err != nil {
		fmt.Printf("Не смог прочитать из json %v\n", err)
		responseData["status"] = "failed"
		sendResponse(w, http.StatusBadRequest, responseData)
		return
	}
	fmt.Printf("Успешно распарсил: %+v\n", trainingData)
	err = insertTrainingData(r.Context(), trainingData)
	if err != nil {
		log.Println(err)
	}
	w.WriteHeader(http.StatusCreated)
	err = encoder.Encode(responseData)
	if err != nil {
		fmt.Printf("Не смог записать в json %v\n", err)
	}
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(userIDKey)
	_, err := db.Exec("INSERT OR IGNORE INTO users (user_id) VALUES (?)", userId)
	if err != nil {
		log.Println(err)
		return
	}
	rows, err := db.Query(`
	SELECT 
		t.training_id AS t_id, t.date,
		e.exercise_id AS e_id, e.base_exercise,
		s.set_id AS s_id, s.reps, s.weight, s.rpe, s.note
	FROM trainings t
	LEFT JOIN exercises e ON t.training_id = e.training_id
	LEFT JOIN sets s ON e.exercise_id = s.exercise_id
	WHERE t.user_id = ?
	ORDER BY t.date DESC; 
	`, userId)
	if err != nil {
		log.Println(err)
		return
	}
	defer rows.Close()

	trainingsMap := make(map[any]*TrainingData)
	exercisesMap := make(map[any]*ExerciseData)
	var finalResponse []*TrainingData
	for rows.Next() {
		var training *TrainingData
		var exercise *ExerciseData
		var trainingId int
		var date string
		var exerciseId *int
		var baseExercise *int
		var setId *int
		var reps *int
		var weight *float32
		var rpe *int
		var note *string
		if err := rows.Scan(&trainingId, &date, &exerciseId, &baseExercise, &setId, &reps, &weight, &rpe, &note); err != nil {
			log.Fatal(err)
		}
		_, exists := trainingsMap[trainingId]
		if !exists {
			training = &TrainingData{
				TrainingId: trainingId,
				Date:       date,
				Exercises:  make([]ExerciseData, 0),
			}
			trainingsMap[trainingId] = training
			finalResponse = append(finalResponse, training)
		}
		if exerciseId != nil {
			_, exists := exercisesMap[exerciseId]
			if !exists {
				exercise = &ExerciseData{
					ExerciseId:   *exerciseId,
					BaseExercise: *baseExercise,
					Sets:         make([]SetData, 0),
				}
				exercisesMap[exerciseId] = exercise
				training.Exercises = append(training.Exercises, *exercise)
			}
		}
		if setId != nil {
			newSet := SetData{
				SetId:  *setId,
				Weight: *weight,
				Reps:   *reps,
				Rpe:    *rpe,
				Note:   *note,
			}
			exercise.Sets = append(exercise.Sets, newSet)
		}
		json.NewEncoder(w).Encode(finalResponse)
	}
}

// func profileHandler(w http.ResponseWriter, r *http.Request) {

// }

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		user_id INTEGER PRIMARY KEY,
		name TEXT,
		weight REAL,
		height INTEGER 
	);
	
	CREATE TABLE IF NOT EXISTS trainings (
		training_id INTEGER PRIMARY KEY,
		user_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(user_id)
	);

	CREATE TABLE IF NOT EXISTS base_exercises (
		base_id INTEGER PRIMARY KEY,
		description TEXT
	);

	CREATE TABLE IF NOT EXISTS exercises (
		exercise_id INTEGER PRIMARY KEY,
		base_exercise INTEGER NOT NULL,
		training_id INTEGER NOT NULL,
		FOREIGN KEY (base_exercise) REFERENCES base_exercises(base_id),
		FOREIGN KEY (training_id) REFERENCES trainings(training_id)
	);

	CREATE TABLE IF NOT EXISTS sets (
		set_id INTEGER  PRIMARY KEY,
		exercise_id INTEGER NOT NULL,
		reps INTEGER NOT NULL,
		weight REAL NOT NULL,
		rpe INTEGER,
		note TEXT,
		FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_Id)
	);
	
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Fatal("Не смог создать таблицы: ", err)
	}

	fmt.Println("Создал таблицы")

}

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "tracker.db")
	if err != nil {
		log.Fatal("Не смог открыть бд: ", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Не смог пингануть бд: ", err)
	}

	createTables()
}

func main() {
	initDB()
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("POST /api/training", authMiddleware(addTrainingHandler))
	http.HandleFunc("GET /me", authMiddleware(meHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
