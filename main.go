package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "modernc.org/sqlite"
)

var db *sql.DB

type TrainingData struct {
	Exercises []ExerciseData `json:"exercises"`
	Date      string         `json:"date"`
}

type ExerciseData struct {
	ExcerciseId  uint8     `json:"exerciseId"`
	BaseExercise uint8     `json:"baseExercise"`
	Sets         []SetData `json:"sets"`
}

type SetData struct {
	Weight float32 `json:"weight"`
	Reps   uint8   `json:"reps"`
	Rpe    uint8   `json:"rpe"`
	Note   string  `json:"note,omitempty"`
}

// TODO: implement telegram initData token validation
func insertTrainingData(trainingData TrainingData) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	_, err = tx.Exec("INSERT INTO users (user_id) VALUES (?)", 1)
	if err != nil {
		return err
	}
	result, err := tx.Exec("INSERT INTO trainings (user_id, date) VALUES (?, ?)", 1, trainingData.Date)
	if err != nil {
		return err
	}
	trainingId, err := result.LastInsertId()
	if err != nil {
		return err
	}
	for _, exercise := range trainingData.Exercises {
		result, err = tx.Exec("INSERT INTO exercises (base_exercise, training_id) VALUES (?, ?)", exercise.BaseExercise, trainingId)
		if err != nil {
			tx.Rollback()
			return err
		}
		exerciseId, err := result.LastInsertId()
		if err != nil {
			tx.Rollback()
			return err
		}
		for _, set := range exercise.Sets {
			_, err = tx.Exec("INSERT INTO sets (exercise_id, reps, weight, rpe) VALUES (?, ?, ?, ?)", exerciseId, set.Reps, set.Weight, set.Rpe)
			if err != nil {
				tx.Rollback()
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

func addTrainingHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Получил запрос")
	if r.Method != http.MethodPost {
		return
	}
	data := map[string]string{
		"status": "ok",
	}
	trainingData := TrainingData{}

	decoder := json.NewDecoder(r.Body)
	encoder := json.NewEncoder(w)

	err := decoder.Decode(&trainingData)
	if err != nil {
		fmt.Printf("Не смог прочитать из json %v\n", err)
		data["status"] = "failed"
		w.WriteHeader(http.StatusBadRequest)
		encoder.Encode(data)
		return
	}
	fmt.Printf("Успешно распарсил: %+v\n", trainingData)
	err = insertTrainingData(trainingData)
	if err != nil {
		log.Println(err)
	}
	err = encoder.Encode(data)
	if err != nil {
		fmt.Printf("Не смог записать в json %v\n", err)
	}
	w.WriteHeader(http.StatusCreated)
}

// func meHandler(w http.ResponseWriter, r *http.Request) {

// }

// func profileHandler(w http.ResponseWriter, r *http.Request) {

// }

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		user_id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
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
		base_id INTEGER  PRIMARY KEY ,
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
		log.Fatal("Couldn't create tables: ", err)
	}

	fmt.Println("Создал таблицы")

}

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "tracker.db")
	if err != nil {
		log.Fatal("Failed to open db: ", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("Couldn't ping DB: ", err)
	}

	createTables()
}

func main() {
	initDB()
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/api/training", addTrainingHandler)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
