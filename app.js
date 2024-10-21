const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('날씨 정보를 가져올 준비가 되었습니다.');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
