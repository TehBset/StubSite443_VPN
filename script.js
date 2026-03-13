const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const fileCard = document.getElementById("fileCard");
const fileName = document.getElementById("fileName");
const resetButton = document.getElementById("resetButton");
const convertButton = document.getElementById("convertButton");
const statusBox = document.getElementById("statusBox");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");

let selectedFile = null;
let progressTimer = null;
let failTimer = null;

const setStatus = ({ title, message, error = false, showProgress = false }) => {
  statusBox.classList.remove("hidden");
  statusBox.classList.toggle("is-error", error);
  statusTitle.textContent = title;
  statusMessage.textContent = message;
  progressBar.classList.toggle("hidden", !showProgress);
};

const clearTimers = () => {
  window.clearInterval(progressTimer);
  window.clearTimeout(failTimer);
};

const resetState = () => {
  clearTimers();
  selectedFile = null;
  fileInput.value = "";
  fileCard.classList.add("hidden");
  convertButton.disabled = true;
  statusBox.classList.add("hidden");
  statusBox.classList.remove("is-error");
  progressFill.style.width = "0%";
};

const selectFile = (file) => {
  if (!file) {
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileCard.classList.remove("hidden");
  convertButton.disabled = false;
  setStatus({
    title: "Файл готов",
    message: "Документ загружен. Можно запускать конвертацию.",
  });
};

const startFakeConversion = () => {
  if (!selectedFile) {
    return;
  }

  clearTimers();
  progressFill.style.width = "7%";

  setStatus({
    title: "Конвертация запущена",
    message: "Подготавливаем структуру документа и рендер PDF-страниц...",
    showProgress: true,
  });

  let currentProgress = 7;

  progressTimer = window.setInterval(() => {
    currentProgress = Math.min(currentProgress + Math.random() * 18, 91);
    progressFill.style.width = `${currentProgress}%`;

    if (currentProgress > 45) {
      statusMessage.textContent =
        "Анализируем стили, таблицы и встроенные шрифты перед экспортом...";
    }
  }, 280);

  failTimer = window.setTimeout(() => {
    clearTimers();
    progressFill.style.width = "100%";
    setStatus({
      title: "Ошибка конвертации",
      message:
        "Не удалось сформировать PDF. Проверьте целостность документа и повторите попытку позже.",
      error: true,
      showProgress: false,
    });
  }, 2200);
};

fileInput.addEventListener("change", (event) => {
  selectFile(event.target.files?.[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer.files;
  selectFile(file);
});

convertButton.addEventListener("click", startFakeConversion);
resetButton.addEventListener("click", resetState);
