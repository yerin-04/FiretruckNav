// 소화전 데이터(hydrants.ts, 약 700KB)는 여기서 직접 문자열에 박아넣지 않는다.
// 안드로이드 WebView의 source={{html}}은 loadDataWithBaseURL을 통해 Binder IPC로
// 전달되는데, 여기에 실려가는 페이로드가 대략 1MB를 넘으면 TransactionTooLargeException으로
// 로드 자체가 실패해 화면이 검게 뜬다. 그래서 지도만 담긴 가벼운 HTML을 먼저 로드시키고,
// 소화전 데이터는 로드가 끝난 뒤 App.tsx에서 injectJavaScript로 잘게 나눠 보낸다.
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
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=c164544cf95f1e116f294084dee919c6&libraries=services,clusterer"></script>
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

    // 동대문구 소화전 마커
    // 데이터는 이 HTML 안에 들어있지 않고, RN 쪽에서 window.addHydrants(청크)를
    // injectJavaScript로 여러 번 호출해서 채워준다.
    var hydrantMarkerImage = new kakao.maps.MarkerImage(
      'data:image/svg+xml;base64,' + btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">' +
        '<circle cx="11" cy="11" r="8" fill="#1e6fea" stroke="#ffffff" stroke-width="2"/>' +
        '</svg>'
      ),
      new kakao.maps.Size(22, 22)
    );

    var hydrantInfoWindow = new kakao.maps.InfoWindow({ removable: true });

    // 마커 수가 많아 (3000개 이상) 클러스터러로 묶어서 표시
    var hydrantClusterer = new kakao.maps.MarkerClusterer({
      map: map,
      averageCenter: true,
      minLevel: 4,
      disableClickZoom: false
    });

    // React Native 쪽에서 injectJavaScript로 호출.
    // list: [{id, lat, lng, address, station, center, status, caliber, pressure}, ...] 청크 하나.
    // 여러 번 호출해서 누적되며, 클러스터러에도 이어서 추가된다.
    window.addHydrants = function (list) {
      var newMarkers = list.map(function (h) {
        var marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(h.lat, h.lng),
          image: hydrantMarkerImage,
          title: h.address
        });
        kakao.maps.event.addListener(marker, 'click', function () {
          hydrantInfoWindow.setContent(
            '<div style="padding:8px;font-size:12px;line-height:1.5;min-width:160px;">' +
            '<strong>소화전</strong><br/>' +
            (h.address || '') + '<br/>' +
            '관할: ' + (h.station || '') + ' ' + (h.center || '') + '<br/>' +
            '상태: ' + (h.status || '') + ' · 구경 ' + (h.caliber || '') + 'mm · 수압 ' + (h.pressure || '') +
            '</div>'
          );
          hydrantInfoWindow.setPosition(marker.getPosition());
          hydrantInfoWindow.open(map, marker);
        });
        return marker;
      });
      hydrantClusterer.addMarkers(newMarkers);
    };

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
