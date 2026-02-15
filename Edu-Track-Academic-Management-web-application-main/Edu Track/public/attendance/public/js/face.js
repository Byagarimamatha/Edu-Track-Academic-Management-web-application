const video = document.getElementById('video');
const canvas = document.getElementById('faceCanvas');
const captureBtn = document.getElementById('captureBtn');
const statusText = document.getElementById('status');

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
});

captureBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const allowedLat = 17.2986622;
    const allowedLon = 78.5173568;
    const allowedRadius = 100; // meters

    const dist = getDistanceFromLatLonInMeters(latitude, longitude, allowedLat, allowedLon);
    if (dist > allowedRadius) {
      statusText.textContent = "❌ You are outside the allowed college area.";
      statusText.style.color = "red";
      return;
    }

    // Capture face
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const faceData = canvas.toDataURL('image/jpeg');
    const qrToken = sessionStorage.getItem('qrToken');

    fetch('/submit-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken, faceData, latitude, longitude })
    })
    .then(res => res.json())
    .then(data => {
      statusText.textContent = data.message;
      statusText.style.color = "green";
    })
    .catch(() => {
      statusText.textContent = "⚠️ Failed to send data.";
      statusText.style.color = "red";
    });

  }, () => {
    statusText.textContent = "⚠️ Unable to fetch your GPS location.";
    statusText.style.color = "red";
  });
};

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
