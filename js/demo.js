/****初始化*****************************************************************************/

var map,startMarker,endMarker,polyline,routeline;
var nj_coordinate = [32.045115, 118.778601];
var baidu_ak = "rnFk0NhFaSRv7b6rXH1dpNAN";

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
	var urlInput = document.getElementById("url-input");

	if(url==""||url.indexOf(".png")<0){
		// document.getElementById("url-input").style.outline = "#EE9A49 auto 5px";
		addClass(urlInput, "empty-input");
		return;
	}else{
		removeClass(urlInput, "empty-input");
	}

	if(name==""){
		name = url.length <= 25? url: url.substring(0,25);
	}

	var storage = window.localStorage;
	storage.setItem(url, name);
	

	alert(storage.getItem(url));
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
	reRoute();
}

function setMarker(marker_id, lat, lng){
	var marker = marker_id == 0? startMarker: endMarker;
	marker.setLatLng([lat,lng]);
	// marker.setOpacity(1);
	// marker.addTo(map);
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
function reset(){
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

	// zoom the map to the polyline
	// map.fitBounds(polyline.getBounds());
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
	// alert(selector.options[selector.selectedIndex].value);

	switch(value){
	case "lbs-driving":
		getLbsDrivingJson();
		break;
	case 'lbs-walking':
		getLbsWalkingJson();
		break;
	case "baidu":
		getBdDrivingJson();
		break;
	case 'hana':
		getHanaJson();
		break;
	case 'osrm':
		break;
	default:
		break;

	}


}

//获取高德驾车线路json  lng,lat
function getLbsDrivingJson(){
	var json = [];
	//地球坐标转成火星坐标
	var startPoint = wgs84togcj02(startMarker.getLatLng().lng, startMarker.getLatLng().lat);
	var endPoint = wgs84togcj02(endMarker.getLatLng().lng, endMarker.getLatLng().lat);
	json.push([startMarker.getLatLng().lng, startMarker.getLatLng().lat]);

	AMap.service(["AMap.Driving"], function() {
		var driveOptions = { 
			panel: 'display-info',                     
			/*policy: AMap.DrivingPolicy.LEAST_TIME */
		};
        //构造类
        var drive = new AMap.Driving(driveOptions);
        //根据起、终点坐标查询路线
        drive.search(startPoint,endPoint , function(status, result){
        	for (var i = 0; i < result.routes[0].steps.length; i++) {
        		var endLoc = result.routes[0].steps[i].end_location;

        		json.push(gcj02towgs84(endLoc.lng, endLoc.lat)); //火星坐标转地球坐标
        	};        	
        	drawGeojson(json);
        });
    });
}
//获取高德步行线路json
function getLbsWalkingJson(){
	var json = [];
	//地球坐标转成火星坐标
	var startPoint = wgs84togcj02(startMarker.getLatLng().lng, startMarker.getLatLng().lat);
	var endPoint = wgs84togcj02(endMarker.getLatLng().lng, endMarker.getLatLng().lat);
	json.push([startMarker.getLatLng().lng, startMarker.getLatLng().lat]);

	AMap.service(["AMap.Walking"], function() {
		var walkOptions = { 
			panel: 'display-info'
		};
        //构造类
        var walk = new AMap.Walking(walkOptions);
        //根据起、终点坐标查询路线
        walk.search(startPoint,endPoint , function(status, result){
        	for (var i = 0; i < result.routes[0].steps.length; i++) {
        		var endLoc = result.routes[0].steps[i].end_location;

        		json.push(gcj02towgs84(endLoc.lng, endLoc.lat)); //火星坐标转地球坐标
        	};        	
        	drawGeojson(json);
        });
    });
}

//百度驾车路线json  lat,lng
function getBdDrivingJson(){
	var json = [];
	var query = new Array();
	query["mode"] = "driving";
	query["origin_region"] = "南京";
	query["destination_region"] = "南京";
	query["output"] = "json";
	query["ak"] = baidu_ak;
	query["coord_type"] = "wgs84";
	query["tactics"] = 12; //导航路线类型:10-不走高速；11-最少时间；12-最短路径(默认)

	// var startPoint = wgs84tobd09(startMarker.getLatLng().lng, startMarker.getLatLng().lat);
	// var endPoint = wgs84tobd09(endMarker.getLatLng().lng, endMarker.getLatLng().lat);

	var startPoint = [startMarker.getLatLng().lng, startMarker.getLatLng().lat];
	var endPoint = [endMarker.getLatLng().lng, endMarker.getLatLng().lat];

	query["origin"] = startPoint[1] + "," + startPoint[0];
	query["destination"] = endPoint[1] + "," + endPoint[0];
	query.sort();

	var queryString = toQueryString(query);
	var url = "http://api.map.baidu.com/direction/v1?" + queryString;

	$.ajax({
		url:url,
		dataType:"jsonp"
	}).done(function(data) {
		var json = [];
		var instruction = [];
		var steps = data.result.routes[0].steps;
		for (var i = 0; i < steps.length; i++) {
			json = json.concat(stringToArray(steps[i].path));
			instruction.push(steps[i].instructions);
		};
		displayInfo(instruction);
		drawGeojson(json);
	});


}

//Hana调C++方法  lat,lng
function getHanaJson(){
	var startPoint = [startMarker.getLatLng().lat, startMarker.getLatLng().lng];
	var endPoint = [endMarker.getLatLng().lat, endMarker.getLatLng().lng];

	query["startLat"] = startMarker.getLatLng().lat;
	query["startLng"] = startMarker.getLatLng().lng;
	query["endLat"] = endMarker.getLatLng().lat;
	query["endLng"] = endMarker.getLatLng().lng;

	var queryString = toQueryString(query);	
	const hostname = '127.0.0.1';
	const port = 1337;
	var url = "http://" + hostname + ":" + port + queryString;

	$.ajax({
		url:url,
		dataType:"jsonp",
		jsonp:"callback",
		jsonpCallback:"success_jsonpCallback"
	}).done(function(data) {
		var json = [];
		var instruction = [];
		// var steps = data.result.routes[0].steps;
		// for (var i = 0; i < steps.length; i++) {
		// 	json = json.concat(stringToArray(steps[i].path));
		// 	instruction.push(steps[i].instructions);
		// };
		// displayInfo(instruction);

		json = data;
		drawGeojson(json);
	});
}


/******工具类*****************************************************************************/

function formatLatLng(latlng){
	return parseFloat(latlng.lat).toFixed(6) + ',' + parseFloat(latlng.lng).toFixed(4) ;
}

function toQueryString(queryArray){
	var res = "";
	for(var key in queryArray){
		var str = key + "=" + queryArray[key] + "&";
		res += str;
	}
	res = res.substring(0,res.length-1);
	return res;
}

function stringToArray(str){
	var strArray = str.split(';');
	var res = [];
	for (var i = 0; i < strArray.length; i++) {
		var tmp = strArray[i].split(",");
		res.push(bd09towgs84(tmp[0],tmp[1]));
	}
	return res;
}

function displayInfo(infos){
	var info = "<ol class='bd-info'>";
	for (var i = 0; i < infos.length; i++) {
		info = info + "<li>" + infos[i] + "</li>";
	}
	info += "</div>";
	$("#display-info").html(info);
}

function clearInfo(){
	$("#display-info").empty();
}


/****通用工具类*****************************************************************************/

function hasClass(obj, cls) {  
	return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));  
}  

function addClass(obj, cls) {  
	if (!this.hasClass(obj, cls)) obj.className += " " + cls;  
}  

function removeClass(obj, cls) {  
	if (hasClass(obj, cls)) {  
		var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');  
		obj.className = obj.className.replace(reg, '');  
	}  
}  

/****jquery****************************************************************************/

$(document).ready(function(){
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

