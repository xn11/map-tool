/****初始化*****************************************************************************/

var map,startMarker,endMarker,polyline,routeline;
var nj_coordinate = [32.045115, 118.778601];


/****初始化****************************************************************************/

$(document).ready(function(){
	initMap();

	//按钮click事件
	$("#show_start_marker").click(function(){
		showMarker(0);
	});

	$("#show_end_marker").click(function(){
		showMarker(1);
	});

	$("#reverse-button").click(function(){
		reserve();
	});

	$("#reset-button").click(function(){
		resetMarker();
	});

	//回车事件
	$("#start-input").bind("keypress",function(e){
		if(e.keyCode == "13"){
			$("#show_start_marker").click();
		}
	});

	$("#end-input").bind("keypress",function(e){
		if(e.keyCode == "13"){
			$("#show_end_marker").click();
		}
	});

	$("#url-input").bind("keypress",function(e){
		if(e.keyCode == "13"){
			$("#add-url-button").click();
		}
	});

	//cancel和还原
	$("#left-cancel").click(function(){
		$("#left-sidebar").animate({left:'-350px'},500,function(){$("#left-icon").show();});		
	});

	$("#left-icon").click(function(){
		$("#left-icon").hide();
		$("#left-sidebar").animate({left:'5px'},500);
	});

	$("#right-cancel").click(function(){
		$("#right-sidebar").animate({right:'-400px'},500,function(){$("#right-icon").show();});
		
	});

	$("#right-icon").click(function(){
		$("#right-icon").hide();
		$("#right-sidebar").animate({right:'5px'},500);
	});
});


/*******************************************************************************************************/
//初始化地图
function initMap(){
	var mbAttr = '&copy; SAP NIC';

	var osm  = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: mbAttr});

	map = L.map('map', {
		center: nj_coordinate,
		zoom: 13,
		/*minZoom: 11,*/
		maxZoom: 17,
		doubleClickZoom: false,
		layers: [osm]
	});

	var baseLayers = getURL();

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

	startMarker = L.marker(nj_coordinate, {icon: startIcon,draggable:true});
	endMarker = L.marker(nj_coordinate, {icon: endIcon,draggable:true});

	startMarker.on('click', hideMarker);
	startMarker.on('dragend',dragMarker);
	endMarker.on('click', hideMarker);
	endMarker.on('dragend',dragMarker);
}

//从localstorage中获取自定义底图URL
function getURL(){
	var mbAttr = '&copy; SAP NIC';

	var osmde   = L.tileLayer('http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {attribution: mbAttr}),
	osm  = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: mbAttr}),
	local  = L.tileLayer('mapNanjingDark3/{z}/{x}/{y}.png', {attribution: mbAttr});

	var baseLayers = {
		"local":local,
		"osm.org": osm,
		"osm.org.de": osmde
	};

	var storage = window.localStorage;
	for (var i = 0; i < storage.length; i++) {
		var url = storage.key(i);
		if(url.indexOf(".png")<0){
			continue;
		}
		var name = storage.getItem(url);

		baseLayers[name] = L.tileLayer(url, {attribution: mbAttr});	
		
	};
	return baseLayers;
}

function clearURL(){
	window.localStorage.clear();
	alert("清空成功！");
	window.location.reload();	//刷新页面
}

function addURL(){
	var name = document.getElementById("name-input").value.trim();
	var url = document.getElementById("url-input").value.trim();

	if(url==""||url.indexOf(".png")<0){
		$("#url-input").addClass("empty-input");
		return;
	}else{
		$("#url-input").removeClass("empty-input");
	}

	if(name==""){
		name = url.length <= 25? url: url.substring(0,25);
	}

	var storage = window.localStorage;
	storage.setItem(url, name);	

	alert(storage.getItem(url) + "添加成功！");
	window.location.reload();	//刷新页面
}

/****marker操作*****************************************************************************/

function dragMarker(e){
	var value = formatLatLng(e.target.getLatLng());
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		document.getElementById("start-input").value = value;
	}else{
		document.getElementById("end-input").value = value;
	}
	drawLine(startMarker,endMarker);
	reRoute();
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

		return;
	}
}

function onMapClick(e) {

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
	reRoute();
}

function setMarker(marker_id, lat, lng){
	var marker = marker_id == 0? startMarker: endMarker;
	marker.setLatLng([lat,lng]);

	map.addLayer(marker);
	map.setView([lat,lng], 13);
	drawLine(startMarker,endMarker);
	reRoute();
}

function showMarker(marker_id){
	var inputId = marker_id == 0? "start-input": "end-input";
	var str = document.getElementById(inputId).value;
	handleMarker(marker_id,str);
}
//重置按钮
function resetMarker(){
	document.getElementById("start-input").value = "";
	document.getElementById("end-input").value = "";
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	map.removeLayer(polyline);
	map.removeLayer(routeline);
	clearInfo();
	map.setView(nj_coordinate, 13);
}
//互换按钮
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
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		map.removeLayer(startMarker);
		document.getElementById("start-input").value = "";
	}else{
		map.removeLayer(endMarker);
		document.getElementById("end-input").value = "";
	}
}

/****routing路线*****************************************************************************/

//画直线
function drawLine(marker_1,marker_2){
	if(map.hasLayer(polyline)){
		map.removeLayer(polyline);		
	}
	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;


	var latlngs = Array();
	latlngs.push(marker_1.getLatLng());
	latlngs.push(marker_2.getLatLng());

	polyline = L.polyline(latlngs, {color:'#FF7F00', weight:2, dashArray:"8,6"});

	map.addLayer(polyline);
}

//画导航线路
function drawGeojson(json){
	if(map.hasLayer(routeline)){
		map.removeLayer(routeline);		
	}

	var route = [{
		"type": "LineString",
		"coordinates": json
	}];

	routeline = L.geoJson(route,{style:{"color": "#FF7F00",	"weight": 5,"opacity": 0.65	}});

	map.addLayer(routeline);
}

//导航服务商onChange()，重新导航
function reRoute(){
	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;

	var selector = document.getElementById("route-seletor");
	var text = selector.options[selector.selectedIndex].text;
	var value = selector.options[selector.selectedIndex].value;

	switch(value){
	case "lbs-driving":
		getLbsJson("Driving", startMarker, endMarker);
		break;
	case 'lbs-walking':
		getLbsJson("Walking", startMarker, endMarker);
		break;
	case "baidu":
		getBdDrivingJson(startMarker,endMarker);
		break;
	case 'hana':
		getHanaJson(startMarker,endMarker);
		break;
	case 'osrm':
		break;
	default:
		break;

	}
}

