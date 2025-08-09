// --- i18n ---
const translations = {
  ru: {
    title: 'HAR Extractor',
    subtitle: 'Извлечение изображений из HAR файлов',
    dropText: 'Перетащите файл .har сюда',
    dropSubtext: 'или нажмите, чтобы выбрать файл',
    btnExtract: 'Извлечь изображения',
    btnReset: 'Сбросить',
    labelImages: 'Найдено изображений:',
    labelExtracted: 'Извлечено:',
    labelSize: 'Общий размер:',
    uploadSuccess: 'Файл загружен',
    uploadError: 'Ошибка: файл должен быть .har'
  },
  en: {
    title: 'HAR Extractor',
    subtitle: 'Extract images from HAR files',
    dropText: 'Drag .har file here',
    dropSubtext: 'or click to select file',
    btnExtract: 'Extract Images',
    btnReset: 'Reset',
    labelImages: 'Images found:',
    labelExtracted: 'Extracted:',
    labelSize: 'Total size:',
    uploadSuccess: 'File loaded',
    uploadError: 'Error: file must be .har'
  },
  zh: {
    title: 'HAR 提取器',
    subtitle: '从 HAR 文件中提取图像',
    dropText: '将 .har 文件拖到这里',
    dropSubtext: '或点击选择文件',
    btnExtract: '提取图像',
    btnReset: '重置',
    labelImages: '找到的图像数:',
    labelExtracted: '已提取:',
    labelSize: '总大小:',
    uploadSuccess: '文件已加载',
    uploadError: '错误：文件必须是 .har'
  }
};

// --- DOM ---
const elements = {
  dropArea: document.getElementById('dropArea'),
  fileInput: document.getElementById('fileInput'),
  importBtn: document.getElementById('importBtn'),
  resetBtn: document.getElementById('resetBtn'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  errorMessage: document.getElementById('errorMessage'),
  progressContainer: document.getElementById('progressContainer'),
  progressBar: document.getElementById('progressBar'),
  resultStats: document.getElementById('resultStats'),
  imageCount: document.getElementById('imageCount'),
  extractedCount: document.getElementById('extractedCount'),
  totalSize: document.getElementById('totalSize'),
  langButtons: document.querySelectorAll('.lang-btn'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  dropText: document.getElementById('dropText'),
  dropSubtext: document.getElementById('dropSubtext'),
  btnExtract: document.getElementById('btnExtract'),
  btnReset: document.getElementById('btnReset'),
  labelImages: document.getElementById('labelImages'),
  labelExtracted: document.getElementById('labelExtracted'),
  labelSize: document.getElementById('labelSize')
};

let selectedFile = null;
let harData = null;
let currentLang = 'ru';

// --- Language ---
function setLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];

  elements.title.textContent = t.title;
  elements.subtitle.textContent = t.subtitle;
  elements.dropText.textContent = t.dropText;
  elements.dropSubtext.textContent = t.dropSubtext;
  elements.btnExtract.textContent = t.btnExtract;
  elements.btnReset.textContent = t.btnReset;
  elements.labelImages.textContent = t.labelImages;
  elements.labelExtracted.textContent = t.labelExtracted;
  elements.labelSize.textContent = t.labelSize;

  elements.langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// --- Events ---
elements.dropArea.addEventListener('click', () => elements.fileInput.click());
elements.dropArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') elements.fileInput.click();
});

elements.dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.dropArea.classList.add('active');
});

elements.dropArea.addEventListener('dragleave', () => {
  elements.dropArea.classList.remove('active');
});

elements.dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.dropArea.classList.remove('active');
  handleFile(e.dataTransfer.files[0]);
});

elements.fileInput.addEventListener('change', (e) => {
  handleFile(e.target.files[0]);
});

elements.importBtn.addEventListener('click', extractImages);
elements.resetBtn.addEventListener('click', resetForm);

elements.langButtons.forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

// --- Logic ---
function handleFile(file) {
  if (!file) return;

  if (!file.name.endsWith('.har')) {
    showError(translations[currentLang].uploadError);
    return;
  }

  selectedFile = file;
  elements.fileName.textContent = translations[currentLang].uploadSuccess;
  elements.fileInfo.style.display = 'block';
  elements.importBtn.disabled = false;
  elements.errorMessage.style.display = 'none';

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      harData = JSON.parse(e.target.result);
    } catch (error) {
      showError(`Невозможно прочитать HAR файл: ${error.message}`);
      resetForm();
    }
  };
  reader.readAsText(file);
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';
  elements.fileInfo.style.display = 'none';
  elements.importBtn.disabled = true;
}

function resetForm() {
  selectedFile = null;
  harData = null;
  elements.fileInfo.style.display = 'none';
  elements.errorMessage.style.display = 'none';
  elements.progressContainer.style.display = 'none';
  elements.resultStats.style.display = 'none';
  elements.importBtn.disabled = true;
  elements.fileInput.value = '';
  elements.progressBar.style.width = '0%';
  elements.imageCount.textContent = '0';
  elements.extractedCount.textContent = '0';
  elements.totalSize.textContent = '0 KB';
}

async function extractImages() {
  if (!selectedFile || !harData) return;

  elements.progressContainer.style.display = 'block';
  elements.resultStats.style.display = 'none';
  elements.importBtn.disabled = true;
  elements.importBtn.innerHTML = `<span>${translations[currentLang].btnExtract}...</span>`;

  try {
    const entries = harData.log.entries;
    const images = entries.filter(entry => {
      const ct = (entry.response && entry.response.content && entry.response.content.mimeType) || '';
      const hasText = entry.response && entry.response.content && entry.response.content.text;
      return ct.startsWith('image/') && hasText;
    });

    elements.imageCount.textContent = images.length;

    if (images.length === 0) {
      showError('В файле не найдено изображений');
      elements.progressContainer.style.display = 'none';
      elements.importBtn.disabled = false;
      elements.importBtn.innerHTML = `<span>${translations[currentLang].btnExtract}</span>`;
      return;
    }

    const zip = new JSZip();
    let totalBytes = 0;

    for (let i = 0; i < images.length; i++) {
      const entry = images[i];
      const contentType = entry.response.content.mimeType;
      const extension = getExtension(contentType);
      const filename = `image_${i + 1}${extension}`;

      const base64Data = entry.response.content.text;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);

      zip.file(filename, bytes);
      totalBytes += bytes.length;

      const progress = ((i + 1) / images.length) * 100;
      elements.progressBar.style.width = `${progress}%`;
      elements.extractedCount.textContent = i + 1;
    }

    elements.totalSize.textContent = formatBytes(totalBytes);
    elements.resultStats.style.display = 'block';

    const content = await zip.generateAsync({ type: 'blob' });
    const date = new Date().toISOString().split('T')[0];
    saveAs(content, `har-images-${date}.zip`);

    elements.importBtn.disabled = false;
    elements.importBtn.innerHTML = `<span>${translations[currentLang].btnExtract}</span>`;
  } catch (error) {
    console.error('Error extracting images:', error);
    showError('Ошибка при извлечении изображений: ' + error.message);
    elements.importBtn.disabled = false;
    elements.importBtn.innerHTML = `<span>${translations[currentLang].btnExtract}</span>`;
  }
}

function getExtension(mimeType) {
  const ext = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return ext[mimeType] || '.bin';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// init
setLanguage('ru');
