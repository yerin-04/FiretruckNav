export const kakaomapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <h1 style="color:red;">테스트 화면입니다</h1>
  <script type="text/javascript"
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=c164544cf95f1e116f294084dee919c6&libraries=services"></script>
  <script>
    var container = document.getElementById('map');
    var options = {
      center: new kakao.maps.LatLng(37.5836, 127.0395), // 동대문구 중심 좌표
      level: 5
    };
    var map = new kakao.maps.Map(container, options);

    // 동대문구 행정구역 범위에 맞춰 초기 화면을 맞춤 (이후 자유롭게 이동/확대 가능)
    var dongdaemunBounds = new kakao.maps.LatLngBounds(
      new kakao.maps.LatLng(37.560, 127.020), // 남서
      new kakao.maps.LatLng(37.607, 127.067)  // 북동
    );
    // WebView는 컨테이너 레이아웃이 늦게 잡히는 경우가 있어,
    // relayout으로 실제 크기를 다시 계산한 뒤 bounds를 적용해야 정확하다.
    setTimeout(function () {
      map.relayout();
      map.setBounds(dongdaemunBounds);
    }, 0);

    // 테스트용 마커 하나
    var marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(37.574607, 127.039585)
    });
    marker.setMap(map);
  </script>
</body>
</html>
`;
