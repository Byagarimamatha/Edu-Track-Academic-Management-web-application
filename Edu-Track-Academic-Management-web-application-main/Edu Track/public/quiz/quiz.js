fetch("/api/quizzes")
  .then(response => response.json())
  .then(quizzes => {
    const quizList = document.getElementById("quizList");
    const grouped = {};

    quizzes.forEach((quiz, index) => {
      const subject = quiz.title || "General";
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push({ quiz, index });
    });

    for (let subject in grouped) {
      const subjectDiv = document.createElement("div");
      subjectDiv.innerHTML = `<h3>📚 ${subject}</h3>`;

      grouped[subject].forEach(({ quiz, index }) => {
        const quizDiv = document.createElement("div");
        quizDiv.innerHTML = `
          <p><strong>${quiz.title}</strong></p>
          <button onclick="startQuiz(${index})">Attempt Quiz</button>
        `;
        subjectDiv.appendChild(quizDiv);
      });

      quizList.appendChild(subjectDiv);
    }

    let quizzesGlobal = quizzes;

    window.startQuiz = function (quizIndex) {
      const quiz = quizzesGlobal[quizIndex];
      const container = document.getElementById("quizContainer");
      let currentQ = 0;
      let score = 0;

      showQuestion();

      function showQuestion() {
        const q = quiz.questions[currentQ];
        container.innerHTML = `
          <p><strong>Q${currentQ + 1}: ${q.question}</strong></p>
          ${q.options.map(option => `
            <label>
              <input type="radio" name="q" value="${option}" /> ${option}
            </label><br>
          `).join("")}
          <br><button onclick="nextQuestion()">Next</button>
        `;
      }

      window.nextQuestion = function () {
        const selected = document.querySelector("input[name='q']:checked");
        if (!selected) return alert("Please select an answer");

        if (selected.value === quiz.questions[currentQ].answer) {
          score++;
        }

        currentQ++;
        if (currentQ < quiz.questions.length) {
          showQuestion();
        } else {
          container.innerHTML = `<h3>✅ Quiz Completed!</h3><p>Score: ${score} / ${quiz.questions.length}</p>`;
        }
      };
    };
  });
