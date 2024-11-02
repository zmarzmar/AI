const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();

app.use(express.json());

let lastWeatherData = null; // 최근 날씨 데이터를 저장할 변수

app.post('/weather/today', async (req, res) => {
    const city = req.body.queryResult.parameters.City; // Dialogflow에서 받은 City 파라미터
    const umbrella = req.body.queryResult.parameters.Umbrella; // Dialogflow에서 받은 Umbrella 파라미터
    const clothes = req.body.queryResult.parameters.clothes; // Dialogflow에서 받은 clothes 파라미터

    // 로그 추가: 요청된 City, Umbrella, Clothes 파라미터 확인
    console.log(`City parameter: ${city}`);
    console.log(`Umbrella parameter: ${umbrella}`);
    console.log(`Clothes parameter: ${clothes}`);

    // 우산 질문만 들어왔을 때 캐시된 데이터를 사용하여 응답
    if (umbrella && lastWeatherData) {
        const { rainProbability, city } = lastWeatherData;
        const umbrellaAdvice = rainProbability >= 50 ? '우산을 가져가세요.' : '우산은 필요하지 않습니다.';

        return res.json({
            fulfillmentText: `${city}의 강수 확률은 ${rainProbability}%. ${umbrellaAdvice}`
        });
    }

    // 옷차림 관련 질문만 들어왔을 때 캐시된 데이터를 사용하여 응답
    if (clothes && lastWeatherData) {
        const { temperature, city } = lastWeatherData;
        let clothesAdvice;

        if (temperature <= 10) {
            clothesAdvice = '추운 날씨입니다. 따뜻하게 입으세요.';
        } else if (temperature > 10 && temperature <= 20) {
            clothesAdvice = '선선한 날씨입니다. 겉옷을 챙기세요.';
        } else {
            clothesAdvice = '더운 날씨입니다. 시원하게 입으세요.';
        }

        return res.json({
            fulfillmentText: `${city}의 현재 기온은 ${temperature}도입니다. ${clothesAdvice}`
        });
    }

    // 도시명이 없을 경우 응답 처리
    if (!city) {
        return res.status(400).json({
            fulfillmentText: `알고 싶은 도시의 이름을 입력해 주세요.`
        });
    }

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

    // regId가 없을 경우 처리
    if (!regId) {
        return res.status(400).json({
            fulfillmentText: `${city}에 대한 날씨 정보를 찾을 수 없습니다.`
        });
    }

    // 날씨 데이터를 가져오는 API 호출
    const apiUrl = 'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstMsgService/getLandFcst';
    const authKey = 'MuM4uqafR-ujOLqmnzfrWA';

    try {
        const response = await axios.get(apiUrl, {
            params: {
                pageNo: 1,
                numOfRows: 10,
                dataType: 'XML',
                regId: regId,
                authKey: authKey
            }
        });

        const xmlData = response.data;

        xml2js.parseString(xmlData, (err, result) => {
            if (err) {
                console.error('XML 파싱 중 오류 발생:', err);
                res.status(500).send('XML 데이터를 처리하는 중 오류가 발생했습니다.');
                return;
            }

            const items = result.response.body[0].items[0].item;
            const weatherData = items[0];
            const forecastTime = weatherData.announceTime[0];
            // 날짜 형식 변환 (YYYY년 MM월 DD일)
            const formattedDate = `${forecastTime.substring(0, 4)}년 ${forecastTime.substring(4, 6)}월 ${forecastTime.substring(6, 8)}일`;
            const temperature = (weatherData.ta && weatherData.ta[0]) ? weatherData.ta[0] : (items[1] && items[1].ta && items[1].ta[0]) ? items[1].ta[0] : '데이터 없음';
            const rainProbability = weatherData.rnSt[0];
            const weatherCondition = weatherData.wf[0];

            // 최근 날씨 데이터를 캐시에 저장
            lastWeatherData = {
                city,
                temperature,
                rainProbability,
                weatherCondition,
                forecastTime
            };

            // 일반 날씨 정보 응답
            const dialogflowResponse = {
                fulfillmentText: `오늘 ${formattedDate} 기준, ${city}의 날씨는 ${weatherCondition}, 기온은 ${temperature}도, 강수확률은 ${rainProbability}%입니다.`
            };

            res.json(dialogflowResponse);
        });

    } catch (error) {
        console.error('API 요청 중 오류 발생:', error);
        res.status(500).send('날씨 정보를 가져오는데 실패했습니다.');
    }
});

// 서버 실행
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
