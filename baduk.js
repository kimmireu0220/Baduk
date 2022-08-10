window.onload = function () {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  
  const margin = 30;
  const cw = (ch = canvas.width = canvas.height = 600 + margin * 2);
  const room = 18; // 바둑판 칸 개수
  const roomSize = 600 / room; // 바둑판 한 칸의 너비
  const stoneSize = 13;  // 바둑돌 크기
  let count = 0; // 짝수(0 포함) : 흑 차례, 홀수 : 백 차례
   
  const withdrawBtn = $('#withdraw'); // '무르기' 버튼
  const reloadBtn = $('#reload'); // '다시하기' 버튼
  const skipBtn = $('#skip'); // '턴 넘기기' 버튼
  const judgeBtn = $('#judge'); // '계가 신청' 버튼
  const set_second_btn = $('#set_second'); // '설정' 버튼(초읽기 시간)
  const set_amount_btn = $('#set_amount'); // '설정' 버튼 (초읽기 횟수)
  
  const second = $('#second'); // 초읽기 시간
  const amount = $('#amount'); // 초읽기 횟수z
  const show = $('.show'); // 남은 시간 및 횟수 표시 문구
  const bar = document.querySelector('.bar'); // 남은 시간 표시 진행바

  let board = new Array(Math.pow(room + 1, 2)).fill(-1); // 바둑판 : 361(19*19)개의 요소를 가진 배열을 생성해서 -1로 채움
  let boardCopy = []; // 바둑판 복사본
  let boardCopyHistory = []; // 바둑판 복사본 저장소

  let isDead = 0; // 사석 발생 유무(0 = 발생 X, 0 초과 = 발생)
  let deadStone = [0, 0]; // [흑, 백] 사석 합계
  let deadStoneHistory = []; // [흑, 백] 사석 기록 저장소

  let countdown; // 설정된 초읽기 시간
  let total; // 설정된 초읽기 횟수
  let penalty = [0, 0]; // 초읽기 사용 횟수 [흑, 백]

  // '무르기' 버튼 누르면, withdraw() 함수 실행
  withdrawBtn.click(() => withdraw());
   
  // '다시하기' 버튼 누르면, 페이지 새로고침
  reloadBtn.click(() => reload());

  // '턴 넘기기' 버튼 누르면, skip() 함수 실행
  skipBtn.click(() => skip());

  // '계가 신청' 버튼 누르면 judge() 함수 실행
  judgeBtn.click(() => judge());  

  // (초읽기 시간)'설정' 버튼 누르면 입력 값 countdown에 저장
  set_second_btn.click(() => countdown = second.val());  

  // (초읽기 횟수)'설정' 버튼 누르면 입력 값 total에 저장, setTimer() 함수 실행
  set_amount_btn.click(() => {
    total = amount.val();
    if (countdown != undefined) {
      setTimer(countdown);
    }
  });    

  // x,y 좌표를 배열의 index값으로 변환
  let xyToIndex = (xPoint, yPoint) => xPoint + yPoint * (room + 1);

  // 배열 index값을 x,y 좌표로 변환
  let indexToXy = (index) => {
    line = room + 1 // 바둑판 선 개수
    x = index % line;
    y = Math.floor(index / line);
    return [x, y];
  };   

  // 바둑판 그리기 
  draw = () => {
    context.fillStyle = '#e38d00';
    context.fillRect(0, 0, cw, ch);
    for (let x = 0; x < room; x++) {
      for (let y = 0; y < room; y++) {
        let w = (cw - margin * 2) / room;
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.strokeRect(w * x + margin, w * y + margin, w, w);
      }
    }
  };

  // 화점에 점 찍기
  dotPoint = () => {
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        context.fillStyle = 'black';
        context.lineWidth = 1;
        context.beginPath();
        context.arc((3 + a) * roomSize + margin + a * 5 * roomSize, (3 + b) * roomSize + margin + b * 5 * roomSize, stoneSize / 3, 0, Math.PI * 2);
        context.fill();
      }
    }
  };

  // 바둑돌 색깔 설정
  setColor = (count) => (count % 2) == 0 ? 1 : 2;

  // 바둑돌에 색깔 칠하기
  paintStone = () => {
    for (i = 0; i < board.length; i++) {
      // 모든 눈금의 돌의 유무,색깔 알아내기
      if (board[xyToIndex(indexToXy(i)[0], indexToXy(i)[1])] == 1) {
        context.fillStyle = 'black';
        context.beginPath();
        context.arc(indexToXy(i)[0] * roomSize + margin, indexToXy(i)[1] * roomSize + margin, stoneSize, 0, Math.PI * 2);
      }
      else if (board[xyToIndex(indexToXy(i)[0], indexToXy(i)[1])] == 2) {
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(indexToXy(i)[0] * roomSize + margin, indexToXy(i)[1] * roomSize + margin, stoneSize, 0, Math.PI * 2);
      }
      context.fill();
    }      
  };

  // 사각형 표시
  drawRect = (x, y, color) => {
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.strokeRect(x * roomSize + margin - roomSize / 2, y * roomSize + margin - roomSize / 2, roomSize, roomSize);
  };

  // 바둑알, 바둑판 그리기(바둑돌 착수 후)
  drawBoard = (x, y) => {
    drawSimpleBoard();
    drawRect(x, y, "red");
    
    if (isDead != 0) {
      // 착수 직전 수순에서 사석이 발생했을 경우, 사석 처리 후 모양을 입력
      boardCopyHistory[boardCopyHistory.length - 1] = boardCopy; 
      isDead = 0;
    }
    
    boardCopy = Object.assign([], board);
    boardCopyHistory.push(boardCopy); // 무르기를 위해서 바둑판 모양을 배열에 입력
    deadStoneHistory.push([0, 0]); // [흑, 백] 사석 발생 X
  };

  // 바둑돌 제거
  deleteStone = (xPoint, yPoint) => {
    if (board[xyToIndex(xPoint, yPoint)] == 1) {
      deadStone[0]++;
      isDead++;
      deadStoneHistory.slice(-1)[0][0] = isDead;
    }
    else if (board[xyToIndex(xPoint, yPoint)] == 2) {
      deadStone[1]++;
      isDead++;
      deadStoneHistory.slice(-1)[0][1] = isDead;
    }
    board[xyToIndex(xPoint, yPoint)] = -1;
  };

  // 바둑알, 바둑판 그리기(바둑돌 착수 후 제외)
  drawSimpleBoard = () => {
    draw();
    dotPoint();
    paintStone();
  };

  // '무르기' 함수
  withdraw = () => {
    if (count == 0) {
      location.reload()
    }    
    
    boardCopyHistory.pop(); // 무르면서 가장 최근 바둑판 모양은 날려버림
    board = boardCopyHistory.slice(-1)[0]; // 바둑판 마지막 모양 
    boardCopy = Object.assign([], board);
    boardCopyHistory[boardCopyHistory.length - 1] = boardCopy;
    
    count--; // 흑 or 백 차례를 한 수 뒤로 물림
    
    if (deadStoneHistory.slice(-1)[0] != [0, 0]) {
      // '무르기' 직전 단계에서 사석이 발생했다면, 발생한 만큼 [흑, 백] 사석 합계에서 차감
      deadStone = [deadStone[0] - deadStoneHistory.slice(-1)[0][0], deadStone[1] - deadStoneHistory.slice(-1)[0][1]];
    }
    deadStoneHistory.pop(); // 무르면서 가장 최근 [흑, 백] 사석 기록은 날려버림

    // 직전 판의 모양으로 바둑판 다시 그리기
    drawSimpleBoard();
    
    if (countdown !== undefined && total !== undefined) {
      clearInterval(timer);
      setTimer(countdown);
    }
  };

  // '다시하기' 함수
  reload = () => location.reload();
   
  // '턴 넘기기' 함수
  skip = () => {
    count++;
    if (countdown !== undefined && total !== undefined) {
      clearInterval(timer);
      setTimer(countdown);
    }
  };  
   
  // '계가 신청' 함수
  judge = () => {
    let stoneNotPlaced = []; // 돌이 놓여지지 않은 곳
    let stonePlaced = []; // 돌이 놓여진 곳
    for (i = 0; i < board.length; i++) {
      // 바둑돌이 놓여지지 않은 곳과 놓여진 곳 구분
      board[i] == -1 ? stoneNotPlaced.push(indexToXy(i)) : stonePlaced.push(indexToXy(i));
    }

    const LARGE_NUMBER = room * Math.sqrt(2); // board[0] ~ board[360] 사이의 거리
    let minDistance = LARGE_NUMBER; 
    let minX;
    let minY;
    let blackPoint = 0; // 흑 집
    let whitePoint = 0; // 백 집
    for (i = 0; i < stoneNotPlaced.length; i++) {
      for (j = 0; j < stonePlaced.length; j++) {
        // 바둑돌이 놓여진 곳 중 바둑돌이 놓여지지 않은 곳과 가장 가까운 곳 찾기
        let distance = Math.sqrt((stoneNotPlaced[i][0] - stonePlaced[j][0]) ** 2 + (stoneNotPlaced[i][1] - stonePlaced[j][1]) ** 2);
        if (distance <= minDistance) {
          minDistance = distance;
          minX = stonePlaced[j][0];
          minY = stonePlaced[j][1];
        }
      }
      minDistance = LARGE_NUMBER;
      board[xyToIndex(minX, minY)] == 1 ? blackPoint++ : whitePoint++; // 가장 가까운 돌 색깔에 따라 집 추가
    }
    
    let diff = Math.abs((blackPoint-deadStone[0])-(whitePoint-deadStone[1])); // 흑 집과 백 집의 차
    let result = makeResult(blackPoint, whitePoint, diff);
    alert(`사석 : ${deadStone[0]} vs ${deadStone[1]}
집 : ${blackPoint} vs ${whitePoint}
결과 : ${(blackPoint-deadStone[0])} vs ${(whitePoint-deadStone[1])}
판정 : ${result}`);
    
    if (countdown != undefined && total != undefined) {
      clearInterval(timer);
    }
  }; 

  // 흑 집, 백 집에 따른 승패 판정
  makeResult = (blackPoint, whitePoint, diff) => {
    return blackPoint - deadStone[0] > whitePoint - deadStone[1] ? `흑 ${diff}집 차 승리`
      : blackPoint - deadStone[0] < whitePoint - deadStone[1] ? `백 ${diff}집 차 승리`
      : "무승부";
  };

  // (초읽기 횟수)'설정' 함수
  setTimer = (countdown) => {
    let time = countdown;
    timer = setInterval(function() {
      showTime(count, time);
      time--;
      showBar(time, countdown);
      if (time < 0) {
        if (countdown !== undefined && total !== undefined) {
          clearInterval(timer);
          setTimer(countdown);
        }
        addPenalty(count);
        judgeByTimer();
      }
    }, 1000)
  };

  // 남은 시간, 남은 횟수 박스에 표시
  showTime = (count, time) => {
    if (count % 2 == 0) {
      show.text("흑 " + String(time).padStart(2, "0") + "초 남음 / " + "흑 " + String(total - penalty[0]).padStart(2, "0") + "번 남음");
      show.removeAttr('id');
    }
    else if (count % 2 == 1) {
      show.text("백 " + String(time).padStart(2, "0") + "초 남음 / " + "백 " + String(total - penalty[1]).padStart(2, "0") + "번 남음");
      show.removeAttr('id');
    }    
  };

  // 남은 시간 진행바에 표시
  showBar = (time, countdown) => {
    bar.value = time + 1;
    bar.max = countdown;
    bar.removeAttribute('id');
  };

  // peanlty 추가
  addPenalty = (count) => (count % 2) == 0 ? penalty[0]++ : penalty[1]++;

  // 일정 penalty에 도달하면, 승패 판정 문구 표시
  judgeByTimer = () => {
    if (penalty[0] == total) {
      alert("시간 초과로 인한 백 승리");
      show.text("흑 00초 남음 / " + "흑 00번 남음");   
      penalty[0] = 0;
      clearInterval(timer);
    }
    if (penalty[1] == total) {
      alert("시간 초과로 인한 흑 승리");
      show.text("백 00초 남음 / " + "백 00번 남음");          
      penalty[1] = 0;
      clearInterval(timer);
    }
  };

  // 마우스 커서 이동 시, 사각형 표시
  document.addEventListener('mousemove', (e) => {
    if (e.target.id == 'canvas') {
      // 클릭 위치 보정
      let x = Math.round(Math.abs(e.offsetX - margin) / roomSize);
      let y = Math.round(Math.abs(e.offsetY - margin) / roomSize);
      if (e.offsetX > 10 && e.offsetX < 640 && e.offsetY > 10 && e.offsetY < 640) {
        // 사각형 표시
        if (board[xyToIndex(x, y)] == -1) {
          drawSimpleBoard();
          (count % 2) == 0 ? drawRect(x, y, "black") : drawRect(x, y, "white");            
          return 0;
        }
        drawSimpleBoard();
      }
      drawSimpleBoard();
    }
  });
  
  // 마우스 좌클릭 시, 바둑돌 착수
  document.addEventListener('click', (e) => {
    if (e.target.id == 'canvas') {
      // 클릭 위치 보정
      let x = Math.round(Math.abs(e.offsetX - margin) / roomSize);
      let y = Math.round(Math.abs(e.offsetY - margin) / roomSize);
      if (e.offsetX > 10 && e.offsetX < 640 && e.offsetY > 10 && e.offsetY < 640) {
        // 바둑돌 착수
        if (board[xyToIndex(x, y)] == -1) {
          board[xyToIndex(x, y)] = setColor(count);
          count++;
          drawBoard(x, y);
          // 계가신청 버튼 활성화
          judgeBtn.attr("disabled", false);
        } 
        if (countdown !== undefined && total !== undefined) {
          clearInterval(timer);
          setTimer(countdown);
          }
        }
    }
  });

  // 마우스 우클릭 시, 바둑돌 제거
  document.addEventListener('contextmenu', (e) => {
    if (e.target.id == 'canvas') {
      // 클릭 위치 보정
      let x = Math.round(Math.abs(e.offsetX - margin) / roomSize);
      let y = Math.round(Math.abs(e.offsetY - margin) / roomSize);
      if (e.offsetX > 10 && e.offsetX < 640 && e.offsetY > 10 && e.offsetY < 640) {
        // 바둑돌 제거
        e.preventDefault();
        deleteStone(x, y);
        boardCopy = Object.assign([], board);
        drawSimpleBoard();

        if (countdown !== undefined && total !== undefined) {
          clearInterval(timer);
          setTimer(countdown);
        }
      }
    }  
  });

  drawSimpleBoard();
};;
