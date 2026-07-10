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

    // 화재차 실시간 위치 마커
    var truckMarkerImage = new kakao.maps.MarkerImage(
      'data:image/svg+xml;base64,' + btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">' +
        '<circle cx="18" cy="18" r="16" fill="#e02020" stroke="#ffffff" stroke-width="3"/>' +
        '</svg>'
      ),
      new kakao.maps.Size(36, 36)
    );
    var truckMarker = null;

    // React Native 쪽에서 injectJavaScript로 호출하는 함수.
    // 마커가 없으면 생성하고, 있으면 위치만 갱신한다.
    window.updateTruckPosition = function (lat, lng) {
      var position = new kakao.maps.LatLng(lat, lng);
      if (!truckMarker) {
        truckMarker = new kakao.maps.Marker({
          position: position,
          image: truckMarkerImage
        });
        truckMarker.setMap(map);
      } else {
        truckMarker.setPosition(position);
      }
    };
  </script>
</body>
</html>
`;
