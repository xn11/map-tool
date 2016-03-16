/****初始化*****************************************************************************/

var map,startMarker,endMarker,polyline,routeline;
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


/****初始化****************************************************************************/

$(document).ready(function(){
	initMap();

	initSelector();

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
}

//初始化selector导航
function initSelector(){
	var routings = CONFIG.routings;
	for (var i = 0; i < routings.length; i++) {
		var option = '<option value="' + i + '">' + routings[i].name + '</option>'
		$("#route-seletor").append(option);
	}	
}

/****marker操作*****************************************************************************/

function onMapClick(e) {

	var value = formatLatLng(e.latlng);

	if(!map.hasLayer(startMarker)){
		startMarker = L.marker(e.latlng, {icon: startIcon,draggable:true});
		startMarker.on('click', hideMarker);
		startMarker.on('dragend',dragMarker);
		map.addLayer(startMarker);
		document.getElementById("start-input").value = value;
	}else if (!map.hasLayer(endMarker)) {
		endMarker = L.marker(e.latlng, {icon: endIcon,draggable:true});
		endMarker.on('click', hideMarker);
		endMarker.on('dragend',dragMarker);
		map.addLayer(endMarker);
		document.getElementById("end-input").value = value;
	}else if(viaMarkers.length < 3){
		var viaMarker = L.marker(e.latlng, {icon: viaIcon,draggable:true,alt:viaMarkers.length});
		viaMarker.on('click', removeViaMarker);
		viaMarker.on('dragend',dragViaMarker);
		map.addLayer(viaMarker);
		// var id = ""+viaMarker._leaflet_id;
		// viaMarkers[id] = viaMarker;
		viaMarkers.push(viaMarker);
	}else{
		return;
	}

	// drawLine(startMarker,endMarker);
	// map.setView(e.latlng);
	reRoute();
}

//Marker事件处理
function dragMarker(e){
	var value = formatLatLng(e.target.getLatLng());
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		document.getElementById("start-input").value = value;
	}else{
		document.getElementById("end-input").value = value;
	}
	// drawLine(startMarker,endMarker);
	reRoute();
}

function hideMarker(e){
	if(e.target.options.icon.options.iconUrl.indexOf('start')>=0){
		map.removeLayer(startMarker);
		document.getElementById("start-input").value = "";
	}else{
		map.removeLayer(endMarker);
		document.getElementById("end-input").value = "";
	}
	map.removeLayer(routeline);
}

function dragViaMarker(e){
	reRoute();
}

function removeViaMarker(e){
	var index = e.target.options.alt;
	map.removeLayer(viaMarkers[index]);
	viaMarkers.splice(index, 1);
	for (var i = 0; i < viaMarkers.length; i++) {
		viaMarkers[i].options.alt = i;
	};
	reRoute();
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
	marker.setLatLng(coord);
	map.addLayer(marker);
	map.setView(coord, 13);

	// drawLine(startMarker,endMarker);
	reRoute();
}
//处理输入的坐标值  return [lat,lng]
function handleMarker(str){
	if(str=="")
		return;

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

//重置按钮
function resetMarker(){
	document.getElementById("start-input").value = "";
	document.getElementById("end-input").value = "";
	map.removeLayer(startMarker);
	map.removeLayer(endMarker);
	map.removeLayer(polyline);
	map.removeLayer(routeline);

	for (var i = 0; i < viaMarkers.length; i++) {
		map.removeLayer(viaMarkers[i]);
	};

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

//导航服务商onChange()，重新导航==>调用routing.js文件
function reRoute(){
	if ((!map.hasLayer(startMarker))||(!map.hasLayer(endMarker))) return;

	var selector = document.getElementById("route-seletor");
	// var text = selector.options[selector.selectedIndex].text;
	var value = selector.options[selector.selectedIndex].value;
	
	//routing.js文件
	getRouteJson(value, startMarker, endMarker, viaMarkers);
	
}
