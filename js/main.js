/****初始化*****************************************************************************/

var map,polyline,routeline;
var nj_coordinate = [32.045115, 118.778601];

var viaMarkers = new Array();

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
	endIcon = new LeafIcon({iconUrl: 'images/marker-end.png'}),
	viaIcon = new LeafIcon({iconUrl: 'images/marker-via.png'});

var startMarker = L.marker(nj_coordinate, {icon: startIcon,draggable:true}),
	endMarker = L.marker(nj_coordinate, {icon: endIcon,draggable:true});

/****初始化****************************************************************************/

$(document).ready(function(){
	initMap();

	initSelector();

	initMarker(0);
	initMarker(1);

	//按钮click事件
	$("#show_start_marker").click(function(){
		showMarker(0);
	});

	$("#show_end_marker").click(function(){
		showMarker(1);
	});

	$("#reverse-button").click(function(){
		reserveButton();
	});

	$("#reset-button").click(function(){
		resetButton();
	});

	$("#add-url-button").click(function(){
		addURL();
	});

	$("#clear-url-button").click(function(){
		clearURL();
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

	//selector变化事件
	// $("#route-seletor").change(function(){
	// 	reRoute();
	// })

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

	$("#clear-start-input").click(function(){
		hideMarkerById(0);
	});

	$("#clear-end-input").click(function(){
		hideMarkerById(1);
	});

	$('#start-input').bind('input propertychange', function(){
		if($('#start-input').val() == ""){
			$('#clear-start-input').hide();
			hideMarkerById(0);
		}else{
			$('#clear-start-input').show();
		}
	});

	$('#end-input').bind('input propertychange', function(){
		if($('#end-input').val() == ""){
			$('#clear-end-input').hide();
			hideMarkerById(1);
		}else{
			$('#clear-end-input').show();
		}
	});
});

/*******************************************************************************************************/
//初始化地图 ==>调用basemap.js文件
function initMap(){
	var baseLayers = getURL();	//调用basemap.js文件

	var defaultLayer = baseLayers[CONFIG.baseMaps[0].name];		//默认CONFIG中第一个basemap底图

	map = L.map('map', {
		center: nj_coordinate,
		zoom: CONFIG.zoom,
		/*minZoom: 11,*/
		/*maxZoom: 17,*/
		doubleClickZoom: false,
		layers: [defaultLayer]
	});

	L.control.layers(baseLayers).addTo(map);

	map.on('click', onMapClick);
	map.on('baselayerchange', onBaselayerChange);
}

//初始化selector导航
function initSelector(){
	var routings = CONFIG.routings;
	for (var i = 0; i < routings.length; i++) {
		var option = '<option value="' + i + '">' + routings[i].name + '</option>'
		$("#route-seletor").append(option);
	}	
}

function initMarker(marker_id){
	var marker = startMarker;
	if(marker_id > 0){
		marker = endMarker;
	}
	marker.on('click', hideMarker);
	marker.on('dragstart',dragstartMarker);
	marker.on('drag',dragMarker);
	marker.on('dragend',dragendMarker);
}

/****marker操作*****************************************************************************/

function onMapClick(e) {

	var value = formatLatLng(e.latlng);

	if(!map.hasLayer(startMarker)){
		// startMarker = L.marker(e.latlng, {icon: startIcon,draggable:true});
		// startMarker.on('click', hideMarker);
		// startMarker.on('dragstart',dragstartMarker);
		// startMarker.on('drag',dragMarker);
		// startMarker.on('dragend',dragendMarker);
		startMarker.setLatLng(e.latlng);
		map.addLayer(startMarker);
		setInputVal("start-input", value);
	}else if (!map.hasLayer(endMarker)) {
		// endMarker = L.marker(e.latlng, {icon: endIcon,draggable:true});
		// endMarker.on('click', hideMarker);
		// endMarker.on('dragstart',dragstartMarker);
		// endMarker.on('drag',dragMarker);
		// endMarker.on('dragend',dragendMarker);
		endMarker.setLatLng(e.latlng);
		map.addLayer(endMarker);
		setInputVal("end-input", value);
	}else{
		return;
	}
	// drawLine(startMarker,endMarker);
	// map.setView(e.latlng);
	reRoute("onMapClick");
}

function setInputVal(input_id, val){
	$("#" + input_id).val(val);
	var icon_id = "clear-" + input_id;
	if(val == ""){
			$('#' + icon_id).hide();
		}else{
			$('#' + icon_id).show();
		}
}

//Marker事件设置
// var pos = null;	//记录拖拽坐标
var	timer = null;	//定时器
var refreshInterval = -1;	//刷新间隔时间
// var interval = null;	//每隔1s reRoute()一次

//开始拖拽，初始化变量
function dragstartMarker(e){
	// if(refreshInterval > 0){
	// 	interval = setInterval("reRoute('dragstartMarker')",refreshInterval);
	// }	
	// pos = e.target.getLatLng();
	timer = new Date();
}

function dragendMarker(e){
	// clearInterval(interval);
	reRoute("dragendMarker");
	updateDisplay(e);
}

function removeViaMarker(e){
	var index = e.target.options.alt;
	map.removeLayer(viaMarkers[index]);
	viaMarkers.splice(index, 1);
	for (var i = 0; i < viaMarkers.length; i++) {
		viaMarkers[i].options.alt = i;
	};
	reRoute("removeViaMarker");
}

//拖拽中，若满足时间间隔且坐标变化，则重置变量、刷新显示坐标、reRoute（）
function dragMarker(e){
	if(refreshInterval > 0 && (new Date() - timer) > refreshInterval){
		time = new Date();
		// if (e.target.getLatLng() !== pos) {
		// 	pos = e.target.getLatLng();
			reRoute("dragMarker");
		// }
	}
	updateDisplay(e);
}
//刷新显示坐标，若为viaMarker则忽略
function updateDisplay(e){
	// document.getElementById("start-input").value = formatLatLng(startMarker.getLatLng);
	// document.getElementById("end-input").value = formatLatLng(endMarker.getLatLng);
	var picurl = e.target.options.icon.options.iconUrl;
	if(picurl.indexOf("via") >= 0){
		return;
	}

	var value = formatLatLng(e.target.getLatLng());
	if(picurl.indexOf('start') >= 0){
		setInputVal("start-input", value);
	}else{
		setInputVal("end-input", value);
	}
}

function hideMarker(e){
	marker_id = e.target.options.icon.options.iconUrl.indexOf('start') >= 0 ? 0 : 1;
	hideMarkerById(marker_id);

	// if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
	// 	map.removeLayer(startMarker);
	// 	document.getElementById("start-input").value = "";
	// }else{
	// 	map.removeLayer(endMarker);
	// 	document.getElementById("end-input").value = "";
	// }
	// map.removeLayer(routeline);

	// if ((!map.hasLayer(startMarker))&&(!map.hasLayer(endMarker))){
	// 	for (var i = 0; i < viaMarkers.length; i++) {
	// 		map.removeLayer(viaMarkers[i]);
	// 	};

	// 	clearInfo();
	// 	viaMarkers = new Array();
	// }	
}

function hideMarkerById(marker_id){
	if(marker_id == 0){
		map.removeLayer(startMarker);
		setInputVal("start-input", "");
	}else{
		map.removeLayer(endMarker);
		setInputVal("end-input", "");
	}
	map.removeLayer(routeline);

	if ((!map.hasLayer(startMarker))&&(!map.hasLayer(endMarker))){
		for (var i = 0; i < viaMarkers.length; i++) {
			map.removeLayer(viaMarkers[i]);
		};

		clearInfo();
		viaMarkers = new Array();
	}	
}

//显示按钮
function showMarker(marker_id){
	var str = document.getElementById("start-input").value;
	var marker = startMarker;

	if(marker_id == 1){
		str = document.getElementById("end-input").value;
		marker = endMarker;
	}

	var coord = handleMarker(str);
	if(coord == null){
		map.removeLayer(marker);
		map.removeLayer(routeline);
	}else{		
		marker.setLatLng(coord);
		map.addLayer(marker);
		map.setView(coord, 15);
	}

	// drawLine(startMarker,endMarker);
	reRoute("showMarker");
}
//处理输入的坐标值  return [lat,lng]
function handleMarker(str){
	if(str=="")
		return null;

	if(str.match(/^\s*[-+]?[0-9]*\.?[0-9]+\s*[\s,;]\s*[-+]?[0-9]*\.?[0-9]+\s*$/)){

		var coord = str.trim().split(/[\s,;]/);	//支持空格、逗号、分号分隔
		var first = coord[0];
		var second = coord[coord.length - 1];

		if(parseFloat(first) > 90){
			return [second, first];		//经纬度交换位置
		}

		return [first, second];
	}
}

//重置marker位置
function resetMarker(marker_id, latlng){
	var marker = startMarker;
	if(marker_id > 0){
		marker = endMarker;
	}
	if(marker_id < 0){
		marker = viaMarkers[ -marker_id - 1];
	}
	marker.setLatLng(latlng);	
}

//重置按钮：清空Marker和via，显示面板
function resetButton(){
	setInputVal("start-input", "");
	setInputVal("end-input", "");
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	// map.removeLayer(polyline);
	map.removeLayer(routeline);

	for (var i = 0; i < viaMarkers.length; i++) {
		map.removeLayer(viaMarkers[i]);
	};

	clearInfo();
	viaMarkers = new Array();
	// map.setView(nj_coordinate, CONFIG.zoom);
}

//互换按钮
function reserveButton(){
	var start_coord = startMarker.getLatLng();
	var end_coord = endMarker.getLatLng();

	// $("#start-input").text(formatLatLng(end_coord));
	// $("#end-input").text(formatLatLng(start_coord));
	setInputVal("start-input", formatLatLng(end_coord));
	setInputVal("end-input", formatLatLng(start_coord));	

	startMarker.setLatLng(end_coord);
	endMarker.setLatLng(start_coord);

	reRoute("reserveButton");
}


/****routing路线*****************************************************************************/

//画直线
// function drawLine(marker_1,marker_2){
// 	if(map.hasLayer(polyline)){
// 		map.removeLayer(polyline);		
// 	}
// 	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;


// 	var latlngs = Array();
// 	latlngs.push(marker_1.getLatLng());
// 	latlngs.push(marker_2.getLatLng());

// 	polyline = L.polyline(latlngs, {color:'#FF7F00', weight:2, dashArray:"8,6"});

// 	map.addLayer(polyline);
// }


var pathColor = CONFIG.baseMaps[0].pathColor;	//路线颜色
//画导航线路  lng,lat
function drawGeojson(json){
	if(map.hasLayer(routeline)){
		map.removeLayer(routeline);		
	}

	var route = [{
		"type": "LineString",
		"coordinates": json
	}];
	//#C105A3 rgb(0, 255, 229)
	routeline = L.geoJson(route,{style:{"color": pathColor,	"weight": 5,"opacity": 0.65	}});

	map.addLayer(routeline);
	routeline.on('click', onRoutelineClick);
}

function onRoutelineClick(e){
	if(viaMarkers.length < 3){
		var viaMarker = L.marker(e.latlng, {icon: viaIcon,draggable:true,alt:viaMarkers.length});
		viaMarker.on('click', removeViaMarker);
		viaMarker.on('dragstart',dragstartMarker);	//开始拖拽
		viaMarker.on('dragend', dragendMarker);		//拖拽结束
		viaMarker.on('drag',dragMarker);
		map.addLayer(viaMarker);
		viaMarkers.push(viaMarker);
	}
}

//导航服务商onChange()，重新导航==>调用routing.js文件
//参数为调用该方法的方法名
function reRoute(callName){
	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;

	var selector = document.getElementById("route-seletor");
	var value = selector.options[selector.selectedIndex].value;

	// clearInfo();
	
	//routing.js文件
	var provider = getRouteJson(value, callName);

	//更新provider配置的刷新间隔
	refreshInterval = provider.refreshInterval;	
}

