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

	"github.com/joho/godotenv"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	_ "modernc.org/sqlite"
)

var db *sql.DB

// go требует чтоб ключ контекста был структурой
type contextKey string

// просто название ключа используемого в контексте
const userIDKey contextKey = "userID"

type TrainingData struct {
	TrainingId int             `json:"trainingId,omitempty"`
	Exercises  []*ExerciseData `json:"exercises"` // хранит указатели чтобы /me хендлер правильно работал
	Date       string          `json:"date"`
}

type ExerciseData struct {
	ExerciseId   int        `json:"exerciseId,omitempty"`
	BaseExercise int        `json:"baseExercise"`
	Sets         []*SetData `json:"sets"`
}

type SetData struct {
	SetId  int     `json:"setId,omitempty"`
	Weight float32 `json:"weight"`
	Reps   int     `json:"reps"`
	Rpe    float32 `json:"rpe"`
	Note   string  `json:"note,omitempty"`
}

func validateAndGetUserId(rawInitData string) (int64, error) {
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

// посмотреть мб добавить insert or ignore
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

func sendResponse(w http.ResponseWriter, statusCode int, data map[string]any) {
	encoder := json.NewEncoder(w)
	w.WriteHeader(int(statusCode))
	err := encoder.Encode(data)
	if err != nil {
		fmt.Printf("Не смог записать в json %v\n", err)
	}
}

// мидлвейр выполняет передаваемую функцию next, но с модифицированным запросом
// (добавляет к нему контекст с userId пользователя, и хендлер уже знает его и уверен что пользователь залогинен)
func authMiddleware(next http.Handler) http.HandlerFunc {
	// мидлвейр принимает http.Handler (любой хендлер, включая FileServer, StripPrefix и обычные HandlerFunc)
	// миддлвейр в свою очередь сразу же возвращает анонимную функцию, внутри которой проходит валидация и
	// вызывается мой хендлер с модифицированным запросом, которую позже вызовет http.HandleFunc когда придет запрос на роут
	return func(w http.ResponseWriter, r *http.Request) {
		responseData := map[string]any{
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
		next.ServeHTTP(w, r.WithContext(ctx)) // не просто next(), а next.ServeHTTP(), потому что http.Handler не может быть вызван явно, только HandleFunc, поэтому вызываем через этот метод, HandleFunc тоже его имеет тк реализует его как интерфейс.

	}
}

// TODO: валидация json: чтобы нельзя было отправить 999 повторений и тд.
func addTrainingHandler(w http.ResponseWriter, r *http.Request) {
	responseData := map[string]any{
		"status": "ok",
	}
	trainingData := TrainingData{}

	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)) // читает не больше мегабайта хз работает или нет
	encoder := json.NewEncoder(w)

	err := decoder.Decode(&trainingData)
	if err != nil {
		// todo: добавить в ответ точную ошибку (в любом случае понадобится на фронте), в том числе maxbyteserror
		log.Println(err)
		responseData["status"] = "failed to decode"
		sendResponse(w, http.StatusBadRequest, responseData)
		return
	}
	fmt.Printf("Успешно распарсил: %+v\n", trainingData)
	err = insertTrainingData(r.Context(), trainingData)
	if err != nil {
		log.Println(err)
		responseData["status"] = "failed to insert training data"
		sendResponse(w, http.StatusBadRequest, responseData)
		return
	}
	w.WriteHeader(http.StatusCreated)
	err = encoder.Encode(responseData)
	if err != nil {
		fmt.Printf("Не смог записать в json %v\n", err)
	}
}

func getTrainingsHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(userIDKey)
	// собираю всю инфу по юзеру, лефт джоины относительно таблицы транировок, потому что упражнений и сетов может не быть
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

	// изначально хотел реализовать все это без указателей, но столкнулся с тем, что после того, как создал тренировку, не могу добавить в нее упражнение так, чтобы оно попало в финальный мап.
	// для этого пришлось использовать указатели
	trainingsMap := make(map[any]*TrainingData) // две мапы которые нужны по сути только для проверки в какой тренировки или упражнении я сейчас нахожусь, не попадают в финальный ответ
	exercisesMap := make(map[any]*ExerciseData)
	var exercise *ExerciseData
	var training *TrainingData
	var finalResponse []*TrainingData
	for rows.Next() {
		var trainingId int
		var date string
		var exerciseId *int
		var baseExercise *int
		var setId *int
		var reps *int
		var weight *float32
		var rpe *float32
		var note *string
		if err := rows.Scan(&trainingId, &date, &exerciseId, &baseExercise, &setId, &reps, &weight, &rpe, &note); err != nil {
			log.Fatal(err)
		}
		training = trainingsMap[trainingId] // смотрю, была ли у меня уже эта тренировка (существует ли в мапе)
		if _, exists := trainingsMap[trainingId]; !exists {
			training = &TrainingData{ // если нет, то создаю новую и беру на нее указатель в памяти (этот указатель останется неизменным до конца, на нем все как раз таки завязано)
				TrainingId: trainingId,
				Date:       date,
				Exercises:  make([]*ExerciseData, 0),
			}
			trainingsMap[trainingId] = training             // добавляю в свой мап
			finalResponse = append(finalResponse, training) // добавляю УКАЗАТЕЛЬ в финальный ответ. это сделано как раз для того, чтобы я потом мог по этому указателю добавить упражнение, и оно было здесь в финал респонсе.
		}
		if exerciseId != nil {
			exercise = exercisesMap[exerciseId] // аналогично тренировкам проверяю и упражнения
			if _, exists := exercisesMap[exerciseId]; !exists {
				exercise = &ExerciseData{ // все аналогично
					ExerciseId:   *exerciseId,
					BaseExercise: *baseExercise,
					Sets:         make([]*SetData, 0),
				}
				exercisesMap[exerciseId] = exercise                       // все аналогично
				training.Exercises = append(training.Exercises, exercise) // здесь самое крутое: training.Exercises, это тоже самое что (*training).Exercises. то есть го сам под капотом разыменует указатель. я, получив значение, лежащее по этому адресу, добавляю туда упражнение, и по этому же адресу лежит уже тренировка с упражнением. поэтому в массиве finalResponse будет она тоже.
			}
		}
		if setId != nil {
			noteStr := ""
			if note != nil {
				noteStr = *note
			}
			newSet := &SetData{
				SetId:  *setId,
				Weight: *weight,
				Reps:   *reps,
				Rpe:    *rpe,
				Note:   noteStr,
			}
			// чтобы сеты добавлялись сделал в структурах слайсы которые хранят указатели на соответствующую инфу.
			exercise.Sets = append(exercise.Sets, newSet) // не добавляется потому что training и exercises никак не связаны. exercise мы добавляем через указатель training, а set в exercise я не могу добавить тк не знаю какое по порядку упражнение.
		}
	}
	err = json.NewEncoder(w).Encode(finalResponse) // узнать почему тут не надо разыменование
	if err != nil {
		log.Println(err)
	}
}

type Profile struct {
	Name   string  `json:"name"`
	Height int     `json:"height"`
	Weight float32 `json:"weight"`
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(userIDKey)
	_, err := db.Exec("INSERT OR IGNORE INTO users (user_id) VALUES (?)", userId)
	if err != nil {
		log.Println(err)
		return
	}
	var name any
	json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&name)
	fmt.Println(name)
	_, err = db.Exec("UPDATE users SET name = ? WHERE user_id = ?", name, userId)
	json.NewEncoder(w).Encode(map[string]any{"user_id": userId, "name": name})
}

func getProfileHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(userIDKey)
	row := db.QueryRow("SELECT name, weight, height FROM users WHERE user_id = ?", userId)
	var name *string
	var weight *float32
	var height *int
	if err := row.Scan(&name, &weight, &height); err != nil {
		sendResponse(w, http.StatusForbidden, map[string]any{"error": "couldn't fetch profile data"})
		if err != sql.ErrNoRows {
			log.Println(err)
			return
		}
	}
	json.NewEncoder(w).Encode(Profile{Name: *name, Weight: *weight, Height: *height})
}

func profileUpdateMetricsHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(userIDKey)
	profile := Profile{}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	err := decoder.Decode(&profile)
	if err != nil {
		sendResponse(w, http.StatusForbidden, map[string]any{"error": "couldn't decode profile data"})
	}
	_, err = db.Exec("UPDATE users SET weight = ?, height = ? WHERE user_id = ?", profile.Weight, profile.Height, userId)
	if err != nil {
		sendResponse(w, http.StatusForbidden, map[string]any{"error": "couldn't update profile data"})
		log.Println(err)
	}
	json.NewEncoder(w).Encode(profile)
}

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
	db, err = sql.Open("sqlite", "tracker.db?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatal("Не смог открыть бд: ", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Не смог пингануть бд: ", err)
	}

	createTables()
}

func main() {
	godotenv.Load()
	initDB()
	// http.Handle("/", authMiddleware(http.FileServer(http.Dir("static"))))
	http.HandleFunc("PUT /api/me", authMiddleware(http.HandlerFunc(meHandler)))
	http.HandleFunc("POST /api/training", authMiddleware(http.HandlerFunc(addTrainingHandler)))
	http.HandleFunc("GET /api/getTrainings", authMiddleware(http.HandlerFunc(getTrainingsHandler)))
	http.HandleFunc("UPDATE /api/profile/updateMetrics", authMiddleware(http.HandlerFunc(profileUpdateMetricsHandler)))
	http.HandleFunc("GET /api/profile", authMiddleware(http.HandlerFunc(getProfileHandler)))
	// http.HandleFunc("POST /api/training", authMiddleware(addTrainingHandler))
	// http.HandleFunc("GET /me", authMiddleware(meHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
