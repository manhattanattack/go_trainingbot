package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "modernc.org/sqlite"
)

type TrainingData struct {
	Exercises []ExerciseData `json:"exercises"`
	Date      string         `json:"date"`
}

type ExerciseData struct {
	ExcerciseId uint16    `json:"exerciseId"`
	Sets        []SetData `json:"sets"`
}

type SetData struct {
	Weight float32 `json:"weight"`
	Reps   uint8   `json:"reps"`
	Note   string  `json:"note,omitempty"`
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

func main() {
	http.Handle("/", http.FileServer(http.Dir("static")))
	http.HandleFunc("/api/training", addTrainingHandler)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
