import { useEffect, useState } from "react"
import "./WordleGame.css"

const API_URL = 'https://api.frontendexpert.io/api/fe/wordle-words';
const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(API_URL);

// const API_FETCH = 'https://corsproxy.io/?' + encodeURIComponent('https://api.frontendexpert.io/api/fe/wordle-words');
const WORD_LENGTH = 5
type Guesses = [string, string, string, string, string, string]

interface GameState {
  guesses: Guesses;
  currentGuess: string;
  currentRowIndex: number;
  gameOver: boolean;
}

const WordleGame = () => {
  const [word, setWord] = useState<string>("")
  const [gameState, setGameState] = useState<GameState>({
    guesses: Array(6).fill('') as Guesses,
    currentGuess: '',
    currentRowIndex: 0,
    gameOver: false,
  });
  const [loading, setLoading] = useState<boolean>(false)

  const fetchWords = async () => {
    try {
      setLoading(true);
      const targetUrl = import.meta.env.DEV ? '/api/api/fe/wordle-words' : PROXY_URL;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Error en la respuesta');
      const words: string[] = await response.json();
      const randomWord = words[Math.floor(Math.random() * words.length)]
      setWord(randomWord)
    } catch (error) {
      console.error("Error al obtener las palabras");
    } finally {
      setLoading(false);
    }
  }

  const updateCurrentGuess = (char: string) => {
    setGameState(prevState => {
      if (prevState.currentGuess.length >= WORD_LENGTH) return prevState;
      return {
        ...prevState,
        currentGuess: prevState.currentGuess + char
      };
    });
  }

  const deleteLastLetter = () => {
    setGameState(prevState => ({
      ...prevState,
      currentGuess: prevState.currentGuess.slice(0, -1)
    }))
  }

  const submitGuess = () => {
    gameState.guesses.map(guess => console.log(getLetterStates(guess, word)))

    setGameState(prevState => {
      const isCorrect = prevState.currentGuess.toLowerCase() === word.toLocaleLowerCase();
      const isLastRow = prevState.currentRowIndex === 5;

      const newGuesses = [...prevState.guesses] as Guesses
      newGuesses[prevState.currentRowIndex] = prevState.currentGuess

      const shouldEndGame = isCorrect || isLastRow

      return {
        ...prevState,
        guesses: newGuesses,
        currentGuess: '',
        currentRowIndex: prevState.currentRowIndex + 1,
        gameOver: shouldEndGame
      }
    })
  }

  const getLetterStates = (guess: string, solution: string) => {
    const states: ("correct" | "present" | "absent" | "")[] = Array(WORD_LENGTH).fill('')
    const solutionLetters = solution.toLowerCase().split("")
    const guessLetters = guess.toLowerCase().split("")
    const remainingLetters = new Map<string, number>();

    // 1. frecuencias
    for (const char of solutionLetters) {
      if (remainingLetters.has(char)) {
        const currentCount = remainingLetters.get(char)!;
        remainingLetters.set(char, currentCount + 1);
      } else {
        remainingLetters.set(char, 1);
      }
    }

    // 2. Marcar (Verdes)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === solutionLetters[i]) {
        states[i] = "correct";

        const char = guessLetters[i];
        const currentCount = remainingLetters.get(char)!;
        remainingLetters.set(char, currentCount - 1);
      }
    }

    // 3. Marcar presentes (Amarillos) o ausentes (Grises)
    for (let i = 0; i < WORD_LENGTH; i++) {
      // Si ya determinamos que es verde, no hacemos nada
      if (states[i] === "correct") continue;

      const char = guessLetters[i];
      const countInSolution = remainingLetters.get(char) || 0;

      if (countInSolution > 0) {
        states[i] = "present";
        remainingLetters.set(char, countInSolution - 1);
      } else {
        states[i] = "absent";
      }
    }

    return states
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (gameState.gameOver) return
    const { key } = e
    if (/^[a-zA-Z]$/.test(key))
      updateCurrentGuess(key.toLowerCase());

    if (key === 'Enter' && gameState.currentGuess.length === WORD_LENGTH) submitGuess();
    if (key === 'Backspace') deleteLastLetter();
  }

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState])

  return (
    <div className="wordle-game">
      {loading ? (
        <h1>Cargando datos...</h1>
      )
        : (
          <div>
            <h1>{word}</h1>
            <div className="board">

              {gameState.guesses.map((guess, rowIndex) => {
                const colorStates = getLetterStates(guess, word)

                return <div key={rowIndex} className="row">

                  {
                    Array.from({ length: WORD_LENGTH }).map((_, charIndex) => {


                      return (rowIndex === gameState.currentRowIndex
                        ?
                        <div key={charIndex} className="tile">
                          {gameState.currentGuess[charIndex]}
                        </div>
                        :
                        (rowIndex > gameState.currentRowIndex ?
                          <div key={charIndex} className="tile">
                            {guess[charIndex]}
                          </div>
                          :
                          <div key={charIndex} className="tile" data-state={colorStates[charIndex]}>
                            {guess[charIndex]}
                          </div>
                        )
                      )

                    })
                  }

                </div>
              }
              )}

            </div>
          </div>
        )
      }
    </div>
  )
}


export default WordleGame