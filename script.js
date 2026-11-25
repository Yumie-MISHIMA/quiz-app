// 問題データ（answer は choices の添字）
const QUESTIONS = [
  {
    question: "メキシコで11月初めに行われ、亡くなった家族の魂を迎えるために祭壇をマリーゴールドで飾る行事は何でしょう？",
    choices: ["カーニバル", "死者の日", "収穫感謝祭", "独立記念日"],
    answer: 1,
    explanation: "「死者の日」では、色鮮やかな祭壇やガイコツの飾りで故人をにぎやかに迎えます。",
  },
  {
    question: "インドの春の祭り「ホーリー」で、人々がお互いにかけ合うものは何でしょう？",
    choices: ["お米", "花びら", "色のついた粉", "砂"],
    answer: 2,
    explanation: "ホーリーでは色粉や色水をかけ合い、春の訪れを祝います。",
  },
  {
    question: "ニュージーランドの先住民マオリに伝わる、力強い掛け声と表情が特徴の伝統的な踊りは何でしょう？",
    choices: ["フラ", "タンゴ", "フラメンコ", "ハカ"],
    answer: 3,
    explanation: "ハカはラグビー代表チームが試合前に披露することでも知られています。",
  },
  {
    question: "スペインの町ブニョールで毎年8月に行われる、参加者がトマトを投げ合う祭りは何でしょう？",
    choices: ["ラ・トマティーナ", "サン・フェルミン", "ラス・ファジャス", "セマナ・サンタ"],
    answer: 0,
    explanation: "ラ・トマティーナでは、町中がトマトで真っ赤に染まります。",
  },
  {
    question: "韓国で旧暦8月15日ごろに家族が集まり、ソンピョン（松餅）を作って祝う行事は何でしょう？",
    choices: ["ソルラル", "チュソク", "タノ", "チョパイル"],
    answer: 1,
    explanation: "チュソク（秋夕）は収穫に感謝し、先祖を敬う韓国の大切な祝日です。",
  },
];

// 画面要素
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const progressEl = document.getElementById("progress");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const scoreEl = document.getElementById("score");
const resultMessageEl = document.getElementById("result-message");
const retryBtn = document.getElementById("retry-btn");

// 正解後、自動で次の問題へ進むまでの待ち時間（ミリ秒）
const AUTO_NEXT_DELAY = 1800;
// 最終問題の回答後、自動で結果発表へ進むまでの待ち時間（ミリ秒）。正解・不正解どちらでも進む
const AUTO_RESULT_DELAY = 2500;

// 進行状態
let currentIndex = 0;
let score = 0;
let autoNextTimer = null;

// 自動遷移の予約を取り消す
function clearAutoNext() {
  if (autoNextTimer !== null) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
}

// 効果音ファイルを読み込む。volume は 0〜1（OtoLogic の素材は小さめに収録されているため 1 にしている）
function loadSound(path, volume) {
  const audio = new Audio(path);
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
}

// 効果音を頭から鳴らす
function playSound(audio) {
  // 連続で鳴らしても頭から再生されるよう巻き戻す
  audio.currentTime = 0;
  // 再生できない環境（自動再生制限など）でも、クイズの進行は止めない
  audio.play().catch(() => {});
}

// 効果音（いずれも OtoLogic の素材、CC BY 4.0）
// 正解：「クイズ ピンポン03-1（短）」 不正解：「クイズ ブザー02-1（中）」
// 結果発表：全問正解は「結果発表02-1」（合格の鐘）、それ以外は「結果発表02-2」（不合格の鐘）
const correctSound = loadSound("sounds/quiz-ding-dong03-1-short.mp3", 1);
const wrongSound = loadSound("sounds/quiz-buzzer02-1-mid.mp3", 1);
const perfectResultSound = loadSound("sounds/quiz-results02-1.mp3", 1);
const normalResultSound = loadSound("sounds/quiz-results02-2.mp3", 1);
const resultSounds = [perfectResultSound, normalResultSound];
let resultSoundsUnlocked = false;

// 結果発表の音は自動遷移（タイマー）の後に鳴ることがあるため、クリック操作の中で事前に再生許可を得ておく。
// 一部のブラウザ（iOS Safari など）は、クリック中に一度再生した音声だけを後から鳴らせるため
function unlockResultSounds() {
  if (resultSoundsUnlocked) return;
  resultSoundsUnlocked = true;
  resultSounds.forEach((audio) => {
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  });
}

// 鳴っている結果発表の音を止める
function stopResultSounds() {
  resultSounds.forEach((audio) => audio.pause());
}

function playCorrectSound() {
  playSound(correctSound);
}

function playWrongSound() {
  playSound(wrongSound);
}

// 結果発表の鐘を鳴らす（全問正解なら合格の鐘、それ以外は不合格の鐘）
function playResultSound(isPerfect) {
  const audio = isPerfect ? perfectResultSound : normalResultSound;
  audio.muted = false;
  playSound(audio);
}

// クイズを最初から始める
function startQuiz() {
  clearAutoNext();
  // 結果発表の鐘が鳴っている途中でやり直したら止める
  stopResultSounds();
  currentIndex = 0;
  score = 0;
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  showQuestion();
}

// 現在の問題を表示する
function showQuestion() {
  const q = QUESTIONS[currentIndex];
  progressEl.textContent = `第${currentIndex + 1}問 / 全${QUESTIONS.length}問`;
  questionEl.textContent = q.question;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextBtn.classList.add("hidden");

  choicesEl.innerHTML = "";
  q.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.textContent = text;
    btn.addEventListener("click", () => selectAnswer(i));
    choicesEl.appendChild(btn);
  });
}

// 選択肢が選ばれたときの判定とフィードバック
function selectAnswer(selected) {
  const q = QUESTIONS[currentIndex];
  const buttons = choicesEl.querySelectorAll(".choice");
  const isCorrect = selected === q.answer;

  // 結果画面で鳴らすファンファーレに備え、クリック操作のうちに再生許可を得ておく
  unlockResultSounds();

  // 二重回答を防ぐため、全選択肢を無効化する
  buttons.forEach((btn) => {
    btn.disabled = true;
  });
  buttons[q.answer].classList.add("correct");

  if (isCorrect) {
    score++;
    playCorrectSound();
    feedbackEl.textContent = `⭕ 正解！ ${q.explanation}`;
    feedbackEl.classList.add("is-correct");
  } else {
    buttons[selected].classList.add("wrong");
    playWrongSound();
    feedbackEl.textContent = `❌ 不正解… 正解は「${q.choices[q.answer]}」です。${q.explanation}`;
    feedbackEl.classList.add("is-wrong");
  }

  const isLast = currentIndex === QUESTIONS.length - 1;
  nextBtn.textContent = isLast ? "結果を見る" : "次の問題へ";
  nextBtn.classList.remove("hidden");

  // 少し待ってから自動で先へ進む（ボタンで先に進むこともできる）
  // 最終問題は正解・不正解にかかわらず結果発表へ、それ以外は正解のときだけ次の問題へ
  if (isLast) {
    autoNextTimer = setTimeout(goNext, AUTO_RESULT_DELAY);
  } else if (isCorrect) {
    autoNextTimer = setTimeout(goNext, AUTO_NEXT_DELAY);
  }
}

// 次の問題、または結果画面へ進む
function goNext() {
  // ボタンと自動遷移が重なって2問進むのを防ぐ
  clearAutoNext();
  currentIndex++;
  if (currentIndex < QUESTIONS.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// 結果画面を表示する
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  scoreEl.textContent = `${QUESTIONS.length}問中${score}問正解`;

  const isPerfect = score === QUESTIONS.length;
  playResultSound(isPerfect);

  let message;
  if (isPerfect) {
    message = "全問正解！世界の文化マスターです！";
  } else if (score >= 3) {
    message = "よくできました！もう少しで全問正解です。";
  } else {
    message = "世界にはまだまだ知らない文化がたくさん。もう一度挑戦してみましょう！";
  }
  resultMessageEl.textContent = message;
}

nextBtn.addEventListener("click", goNext);
retryBtn.addEventListener("click", startQuiz);

startQuiz();
