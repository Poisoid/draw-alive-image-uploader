import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🔐 Replace these with your own details
const supabaseUrl = 'https://haskvngdptcsjwvpspkv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc2t2bmdkcHRjc2p3dnBzcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MDIwODcsImV4cCI6MjA2MjA3ODA4N30.PXtgBmoi9oy8XFfLmIDhnq0RQ6e5PzEZ84px9Xy6OFY';
const bucketName = 'drawings';

const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const fileNameLabel = document.getElementById('fileName');
const status = document.getElementById('statusMsg');
const uploadBtn = document.getElementById('uploadBtn');
const userNameInput = document.getElementById('userName');
const templateTypeSelect = document.getElementById('templateType');

// Show preview when file is selected
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileNameLabel.textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    fileNameLabel.textContent = 'No file selected';
    preview.style.display = 'none';
  }
});

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const userName = userNameInput.value.trim();
  const templateType = templateTypeSelect.value;

  if (!file) {
    alert('Please select a PNG file.');
    return;
  }

  if (file.type !== 'image/png') {
    alert('Only PNG files are allowed.');
    return;
  }

  if (!userName) {
    alert('Please enter your name.');
    return;
  }

  if (!templateType) {
    alert('Please select a template type.');
    return;
  }

  const fileName = `${Date.now()}_${file.name}`;

  status.textContent = 'Uploading...';
  status.style.color = 'white';

  // Upload image to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (error) {
    console.error('Upload failed:', error.message);
    status.textContent = '❌ Upload failed.';
    status.style.color = 'red';
    return;
  }

  // Get the public URL of the uploaded file
  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  const imageUrl = publicData.publicUrl;

  // Insert metadata record into your DB table, including name and template type
  const { error: dbError } = await supabase
    .from('images')
    .insert([
      {
        name: file.name,
        url: imageUrl,
        uploader_name: userName,
        template_type: templateType
      }
    ]);

  if (dbError) {
    console.error('DB insert failed:', dbError.message);
    status.textContent = '❌ Database insert failed.';
    status.style.color = 'red';
    return;
  }

  status.textContent = '✅ Uploaded successfully!';
  status.style.color = 'lightgreen';

  // Clear inputs and preview
  fileInput.value = '';
  preview.style.display = 'none';
  fileNameLabel.textContent = 'No file selected';
  userNameInput.value = '';
  templateTypeSelect.value = '';
});
