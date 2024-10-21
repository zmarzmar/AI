const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();

app.get('/weather/today', async (req, res) => {
  const apiUrl = 'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstMsgService/getLandFcst'; // API 기본 URL
  const authKey = 'MuM4uqafR-ujOLqmnzfrWA'; // 인증키
  const regId = '11B10101'; // 백령도의 예보구역코드

  try {
    const response = await axios.get(apiUrl, {
      params: {
        pageNo: 1,
        numOfRows: 10,
        dataType: 'XML', // XML 형식으로 요청
        regId: regId,
        authKey: authKey
      }
    });

    const xmlData = response.data;

    // XML 데이터를 JSON으로 변환
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        console.error('XML 파싱 중 오류 발생:', err);
        res.status(500).send('XML 데이터를 처리하는 중 오류가 발생했습니다.');
        return;
      }

      // 변환된 JSON 데이터에서 필요한 정보를 추출
      const items = result.response.body[0].items[0].item; // 예보 항목 리스트

      // 예를 들어 첫 번째 항목의 날씨 데이터를 가져온다고 가정
      const weatherData = items[0];
      const forecastTime = weatherData.announceTime[0]; // 발표 시각
      const temperature = weatherData.ta[0] || '데이터 없음'; // 예상 기온
      const rainProbability = weatherData.rnSt[0]; // 강수 확률
      const weatherCondition = weatherData.wf[0]; // 날씨 정보

      res.send(`오늘 ${forecastTime} 기준, 백령도의 날씨는 ${weatherCondition}, 기온은 ${temperature}도, 강수확률은 ${rainProbability}%입니다.`);
    });

  } catch (error) {
    console.error('API 요청 중 오류 발생:', error);
    res.status(500).send('날씨 정보를 가져오는데 실패했습니다.');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
