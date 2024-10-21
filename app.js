const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();

app.use(express.json());

app.post('/weather/today', async (req, res) => {
    const city = req.body.queryResult.parameters.City; // Dialogflow에서 받은 City 파라미터
    
    // 도시명에 따른 regId 매핑 객체
    const cityRegIds = {
      '서울': '11B10101',
      '인천': '11B20201',
      '수원': '11B20601',
      '파주': '11B20305',
      '춘천': '11D10301',
      '원주': '11D10401',
      '강릉': '11D20501',
      '대전': '11C20401',
      '서산': '11C20101',
      '세종': '11C20404',
      '청주': '11C10301',
      '제주': '11G00201',
      '서귀포': '11G00401',
      '광주': '11F20501',
      '목포': '21F20801',
      '여수': '11F20401',
      '전주': '11F10201',
      '군산': '21F10501',
      '부산': '11H20201',
      '울산': '11H20101',
      '창원': '11H20301',
      '대구': '11H10701',
      '안동': '11H10501',
      '포항': '11H10201',
      '구미': '11H10301',
      '경주': '11H10202',
      '진주': '11H20401',
      '익산': '11F10203',
      '남원': '11F10205',
      '성남': '11B20602',
      '고양': '11B20605'
    };
  
    const regId = cityRegIds[city]; // 도시 이름에 해당하는 regId 가져오기
  
    // 도시명이 잘못되었을 경우 처리
    if (!regId) {
      return res.status(400).json({
        fulfillmentText: `${city}에 대한 날씨 정보를 찾을 수 없습니다.`
      });
    }
  
    const apiUrl = 'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstMsgService/getLandFcst'; // API 기본 URL
    const authKey = 'MuM4uqafR-ujOLqmnzfrWA'; // 인증키
  
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
        const weatherData = items[0];
        const forecastTime = weatherData.announceTime[0]; // 발표 시각
        const temperature = weatherData.ta[0] || '데이터 없음'; // 예상 기온
        const rainProbability = weatherData.rnSt[0]; // 강수 확률
        const weatherCondition = weatherData.wf[0]; // 날씨 정보
  
        // Dialogflow에 전송할 응답 메시지
        const dialogflowResponse = {
          fulfillmentText: `오늘 ${forecastTime} 기준, ${city}의 날씨는 ${weatherCondition}, 기온은 ${temperature}도, 강수확률은 ${rainProbability}%입니다.`
        };
  
        res.json(dialogflowResponse); // Dialogflow로 응답 전송
      });
  
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
      res.status(500).send('날씨 정보를 가져오는데 실패했습니다.');
    }
  });
  
// 서버 실행 부분 추가
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
