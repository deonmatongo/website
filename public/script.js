document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("accessGranted") === 'false') window.location.href = "/interviews";

  function promptCameraAccess() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function (stream) {
        // Do something with the video stream, e.g., display it on the page
        var video = document.getElementById('video');
        video.srcObject = stream;
        
      })
      .catch(function (error) {
        alert('Please allow camera access to use this feature.');
      });
  }
  
  // Call the function when needed, e.g., on button click or page load
  promptCameraAccess();

  let currentQuestionIndex = 0;
  let startTime = new Date();
  const language = localStorage.getItem("selectedLanguage");
  const code = localStorage.getItem("unique-code");
  const questions = {
    JavaScript: [
      {
        title: "Q1: Enhanced Dynamic Object Key Manipulation",
        description: "Enhance the function `transformObject` to recursively process nested objects and arrays, applying the original logic (uppercase keys for string values, lowercase for numbers) throughout the entire object structure. The values should remain unchanged.",
        exampleInput: `{ user: { name: "JavaScript", version: 6, details: { released: 1995, type: 'language' } } }`,
        exampleOutput: `{ USER: { NAME: "JavaScript", version: 6, DETAILS: { RELEASED: 1995, TYPE: 'language' } } }`,
      },
      {
        title: "Q2: Advanced Array Transformation Challenge",
        description: "Modify the `groupElements` function to accept a grouping function as an argument, allowing the categorization logic to be dynamically defined. The function should then group elements according to both type and the custom grouping logic provided.",
        exampleInput: `[1, 'apple', 2, 'banana', true, false]`,
        exampleOutput: `[[1, 2], ['apple', 'banana'], [true, false]]`, // Output would vary based on the grouping function provided.
      },
      {
        title: "Q3: Robust Asynchronous Programming Puzzle",
        description: "Upgrade the `sequentialRequests` function to implement error handling and a retry mechanism, allowing each URL fetch to be retried up to two additional times before proceeding or failing.",
        exampleInput: `['https://api.example1.com', 'https://api.example2.com']`,
        exampleOutput: "Console logs with retry logic, assuming variable response lengths.",
      },
      {
        title: "Q4: Configurable Closure Counter Function",
        description: "Extend the `createCounter` function to allow for an optional initial value and increment step. Include a reset functionality within the returned function to reset the counter to the initial value.",
        exampleInput: "const counter = createCounter();\nconsole.log(counter());\nconsole.log(counter());\nconsole.log(counter());",
        exampleOutput: "Output based on initial value and increment step, with reset feature included.",
      },
    ],
    Java: [
      {
        title: "Q1: Advanced Class Structure with Encapsulation",
        description: "Expand the `Car` class to include private fields for `make`, `model`, `year`, and `mileage`. Create a constructor, getters/setters, and a `displayDetails` method that includes logic to display `High Mileage` if the mileage is over 100,000 miles. Implement input validation in setters.",
        exampleInput: "Car myCar = new Car('Toyota', 'Corolla', 2021, 120000); myCar.displayDetails();",
        exampleOutput: "Make: Toyota, Model: Corolla, Year: 2021, Mileage: 120000 - High Mileage",
      },
      {
        title: "Q2: Polymorphism and Interface Implementation",
        description: "Extend the `Animal` interface with a default method `sleep` that prints 'Sleeping'. Create a class `Dog` that implements `Animal`, overrides `makeSound`, and adds a method `displayBreed` with a private `breed` field set through the constructor.",
        exampleInput: "Animal myDog = new Dog('Beagle'); System.out.println(myDog.makeSound()); myDog.sleep();",
        exampleOutput: "Bark\nSleeping",
      },
      {
        title: "Q3: Advanced Exception Handling and Logging",
        description: "Enhance the `divide` method to throw a custom exception `InvalidDivisionException` when division by zero is attempted. Include error logging within the catch block using Java's logging framework.",
        exampleInput: "try { System.out.println(divide(10, 0)); } catch (InvalidDivisionException e) { e.printStackTrace(); }",
        exampleOutput: "InvalidDivisionException stack trace",
      },
      {
        title: "Q4: Enhanced Generics with Multiple Types",
        description: "Modify the `Box` class to support a pair of types T and U with two private members. Provide getters/setters for these members and a method `displayTypes` that prints the types of T and U. Ensure type safety by using bounded type parameters.",
        exampleInput: "Box<Integer, String> myBox = new Box<>(); myBox.setT(123); myBox.setU('Hello'); myBox.displayTypes();",
        exampleOutput: "Type T: Integer, Type U: String",
      },
    ]    
  };

  const languageQuestions = questions[language] || [];
  
  loadState();
  loadQuestion(currentQuestionIndex);
  
  if (localStorage.getItem("accessGranted") === 'true') updateTimer();

  document.getElementById("submit-btn").addEventListener("click", handleSubmit);
  document.getElementById("code-area").addEventListener("input", saveState);

  function saveState() {
    const userCode = document.getElementById("code-area")?.value;
    const state = {
      currentQuestionIndex,
      startTime: startTime.getTime(),
      userCode,
    };
    localStorage.setItem("codingAssessmentState", JSON.stringify(state));
  }

  function loadState() {
    const savedState = localStorage.getItem("codingAssessmentState");
    if (savedState) {
      const state = JSON.parse(savedState);
      currentQuestionIndex = state.currentQuestionIndex;
      startTime = new Date(state.startTime);
      document.getElementById("code-area").value = state.userCode || "";
    }
  }

  function loadQuestion(index) {
    if (index >= languageQuestions.length) {
      completeTest();
      return;
    }

    const question = languageQuestions[index];
    document.getElementById("question").innerHTML = 
      `<h3>${question.title}</h3><p>${question.description}</p><p>Example Input: ${question.exampleInput}</p><p>Example Output: ${question.exampleOutput}</p>`;
  }

  function updateTimer() {
    setInterval(() => {
      const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
      const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0");
      const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0");
      const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

      document.getElementById("timer").textContent = `${hours}:${minutes}:${seconds}`;
      saveState();
    }, 1000);
  }

  const totalDuration = 3600000; // 1 hour in milliseconds
  let timerInterval;


  function handleSubmit() {
    const userCode = document.getElementById("code-area").value;
    if (!userCode.trim()) {
      alert("Code area is empty. Please provide a solution before submitting.");
      return;
    }

    const timeSpent = new Date() - startTime; // Time spent on the current question in milliseconds
    const body = {
      answer: userCode,
      language: language,
      id: code,
      title: languageQuestions[currentQuestionIndex].title,
      question: `${languageQuestions[currentQuestionIndex].description}
                 ${languageQuestions[currentQuestionIndex].exampleInput}
                 ${languageQuestions[currentQuestionIndex].exampleOutput}`,
      timeSpent: timeSpent
    };
    sendTimeData(body, currentQuestionIndex >= languageQuestions.length - 1);

    if (currentQuestionIndex < languageQuestions.length - 1) {
      alert("Submission received! Loading next question.");
      currentQuestionIndex++;
      loadQuestion(currentQuestionIndex);
      document.getElementById("code-area").value = '';
      startTime = new Date(); // Reset the start time for the next question
    } else {
      sendTimeData(body, true); // Send the last question data and then complete the test
    }
    saveState();
  }

  function sendTimeData(body, isLastQuestion) {
    fetch('/nextQuestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(data => {
      if (isLastQuestion) {
        completeTest();
      }
    })
    .catch((error) => {
      console.error('Error sending time data:', error);
    });
  }

  function displayRemainingTime(remainingTime) {
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    document.getElementById("timer").textContent = `Time spent: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function initializeTimer() {
    let storedStartTime = localStorage.getItem("startTime");

    if (!storedStartTime) {
      storedStartTime = new Date().getTime();
      localStorage.setItem("startTime", storedStartTime);
      startTime = new Date(storedStartTime);
    } else {
      storedStartTime = parseInt(storedStartTime, 10);
      startTime = new Date(storedStartTime);
    }

    updateTimer();
    updateTimer2(storedStartTime);
  }

  function updateTimer2(storedStartTime) {
    timerInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      const elapsed = currentTime - storedStartTime;
      const remainingTime = totalDuration - elapsed;

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        completeTest();
      } else {
        displayRemainingTime(remainingTime);
      }
    }, 1000);
  }

  function displayRemainingTime(remainingTime) {
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    document.getElementById("countdown-timer").textContent = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  loadState();
  loadQuestion(currentQuestionIndex);

  if (localStorage.getItem("accessGranted") === 'true') {
    initializeTimer();
  }

  if (localStorage.getItem("accessGranted") === 'true') {
    initializeTimer();
  }

  function completeTest() {
    document.getElementById("container").innerHTML = "<p>Test complete. Thank you!<br>Please wait for feedback in the coming days.</p>";
    localStorage.removeItem("codingAssessmentState");
    localStorage.setItem("accessGranted", "false");
    localStorage.setItem("testCompleted", "true");
    clearInterval(timerInterval);
  
    // Assuming 'code' contains the candidate's unique identifier
    const testData = {
      id: code
    };
  
    fetch('/testCompleted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    .then(response => response.json())
    .then(data => {
      // Redirect or handle the response as needed
      window.location.href = "/interviews";
    })
    .catch(error => {
      console.error('Error updating test status:', error);
      // Handle the error as needed
    });
  }
  

});
