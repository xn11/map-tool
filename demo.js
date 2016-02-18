
var map,startMarker,endMarker,polyline;

function initMap(){
	var mbAttr = '&copy; SAP NIC';

	var osmde   = L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {attribution: mbAttr}),
	osm  = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: mbAttr}),
	local  = L.tileLayer('mapNanjingDark3/{z}/{x}/{y}.png', {attribution: mbAttr})
	;

	map = L.map('map', {
		center: [32.045115, 118.778601],
		zoom: 13,
		minZoom: 11,
		maxZoom: 17,
		doubleClickZoom: false,
		layers: [local]
	});

	var baseLayers = {
		"local":local,
		"osm.org": osm,
		"osm.org.de": osmde
	};

	L.control.layers(baseLayers).addTo(map);

	map.on('click', onMapClick);

	// marker图标声明
	var LeafIcon = L.Icon.extend({
		options: {
			shadowUrl: 'images/marker-shadow.png',
			iconSize:     [25, 41],
			shadowSize:   [41, 41],
			iconAnchor:   [13, 41],
			shadowAnchor: [13, 41],
			popupAnchor:  [0, -33]
		}
	});

	var startIcon = new LeafIcon({iconUrl: 'images/marker-start.png'}),
	endIcon = new LeafIcon({iconUrl: 'images/marker-end.png'});

	startMarker = L.marker([32.045115, 118.778601], {icon: startIcon,draggable:true});
	endMarker = L.marker([32.045115, 118.778601], {icon: endIcon,draggable:true});

	// var startLayer = L.layerGroup([setMarker]);

	startMarker.on('click', hideMarker);
	startMarker.on('dragend',dragMarker);
	endMarker.on('click', hideMarker);
	endMarker.on('dragend',dragMarker);

}

function dragMarker(e){
	var value = formatLatLng(e.target.getLatLng());
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		document.getElementById("start-input").value = value;
	}else{
		document.getElementById("end-input").value = value;
	}
	drawLine(startMarker,endMarker);
}

function formatLatLng(latlng){
	return parseFloat(latlng.lat).toFixed(6) + ',' + parseFloat(latlng.lng).toFixed(4) ;
}

function handleMarker(marker_id, str){
	if(str=="")
		return;

	if(str.match(/^\s*[-+]?[0-9]*\.?[0-9]+\s*[\s,;]\s*[-+]?[0-9]*\.?[0-9]+\s*$/)){

		var coord = str.trim().split(/[\s,;]/);	//支持空格、逗号、分号分隔
		var first = coord[0];
		var second = coord[coord.length - 1];

		setMarker(marker_id, first, second);

		if(parseFloat(first) > 90){
			setMarker(marker_id, second, first);  //经纬度交换位置
		}

		// OSRM.Geocoder.updateAddress( marker_id );
		return;
	}
}

function onMapClick(e) {
	/*var popup = L.popup();
	popup
	.setLatLng(e.latlng)
	.setContent("You clicked the map at " + e.latlng.toString())
	.openOn(map);*/

	// L.marker(e.latlng,{draggable:true,}).addTo(map);
	var value = formatLatLng(e.latlng);
	if(!map.hasLayer(startMarker)){
		startMarker.setLatLng(e.latlng);
		map.addLayer(startMarker);
		document.getElementById("start-input").value = value;
	}else if (!map.hasLayer(endMarker)) {
		endMarker.setLatLng(e.latlng);
		map.addLayer(endMarker);
		document.getElementById("end-input").value = value;
	}else{
		return;
	}

	drawLine(startMarker,endMarker);
	// map.setView(e.latlng);
}

function setMarker(marker_id, lat, lng){
	var marker = marker_id == 0? startMarker: endMarker;
	marker.setLatLng([lat,lng]);
	// marker.setOpacity(1);
	// marker.addTo(map);
	map.addLayer(marker);
	map.setView([lat,lng], 13);
	drawLine(startMarker,endMarker);
}

function showMarker(marker_id){
	var inputId = marker_id == 0? "start-input": "end-input";
	var str = document.getElementById(inputId).value;
	handleMarker(marker_id,str);
}

function reset(){
	document.getElementById("start-input").value = "";
	document.getElementById("end-input").value = "";
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	map.removeLayer(polyline);
	map.setView([32.045115, 118.778601], 13);
}

function reserve(){
	var tmp = document.getElementById("start-input").value;
	document.getElementById("start-input").value = document.getElementById("end-input").value;
	document.getElementById("end-input").value = tmp;
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	showMarker(0);
	showMarker(1);
}

function hideMarker(e){
	// e.target._removeIcon();
	// e.target._removeShadow();
	// e.target.setOpacity(0);
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		map.removeLayer(startMarker);
		document.getElementById("start-input").value = "";
	}else{
		map.removeLayer(endMarker);
		document.getElementById("end-input").value = "";
	}
}

function drawLine(marker_1,marker_2){
	if(map.hasLayer(polyline)){
		map.removeLayer(polyline);		
	}
	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;


	var latlngs = Array();
	latlngs.push(marker_1.getLatLng());
	latlngs.push(marker_2.getLatLng());

	polyline = L.polyline(latlngs, {color:'#FF7F00', weight:2, dashArray:"8,6"});

	// zoom the map to the polyline
	// map.fitBounds(polyline.getBounds());
	map.addLayer(polyline);
}

/*function linestring(){
	var c = [];
	c.push(startMarker.latlng);
	c.push(endMarker.latlng);

	var pathLine = L.polyline(c).addTo(map);
}*/

function addURL(){
	var name = document.getElementById("name-input").value.trim();
	var url = document.getElementById("url-input").value.trim();

	if(url==""){
		alert("请输入底图URL");
		return;
	}

	if(name==""){
		name = url.length <= 25? url: url.substring(0,25);
	}

	

	alert(name);

	document.getElementById("name-input").value = "";
	document.getElementById("url-input").value = "";
}
