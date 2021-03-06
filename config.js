var CONFIG = {

    //底图列表，默认显示第一个
    "baseMaps":[
        {
            "name":"osm",
            "url":"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "pathColor":  "rgb(0, 51, 255)"
        },
        {
            "name":"osmde",
            "url":"http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
            "pathColor":  "rgb(0, 51, 255)"
        },
        {
            "name":"local",
            "url":"mapNanjingDark3/{z}/{x}/{y}.png",
            "pathColor":  "rgb(0, 255, 229)"
        }
    ],

    //导航服务来源
    "webServices":
        {
            "baidu": {
                "url": "http://api.map.baidu.com/direction/v1?", //请求服务的url
                "key": "rnFk0NhFaSRv7b6rXH1dpNAN",
                "routeType": ["driving"],
                "refreshInterval": -1    //刷新间隔毫秒，-1则不刷新
            },
            "gaode": {
                "url": "http://webapi.amap.com/maps?v=1.3&",
                "key": "2ad58dd1832ce97111bf2f62921a968c",
                "routeType": ["Driving","Walking"],
                "refreshInterval": -1
            },
            "hana": {
                "hostname": "127.0.0.1",
                "port": 1337,
                "refreshInterval": -1   
            },
            "osrm": {
                "url": "http://localhost:5000/viaroute?",
                "refreshInterval": 300
            },
            "myroute": {
                "url": "http://NKGD50844908A.apj.global.corp.sap:9000/myroute?",
                "refreshInterval": 100
            },            
        },

    //页面提供的导航选项
    "routings":[
        {
            "name": "高德驾车导航",
            "id": "gaode-driving",
            "provider": "gaode",
            "routeType": "Driving"
        },
        {
            "name": "百度导航",
            "id": "baidu",
            "provider": "baidu",
            "routeType": "driving",
            "routeOptions": {
                "origin_region": "南京",
                "destination_region": "南京",
                "tactics": 12,          //导航路线类型:10-不走高速；11-最少时间；12-最短路径(默认)
            }
        },
        {
            "name": "HANA导航",   
            "id": "hana",
            "provider": "hana"
        },
        {
            "name": "OSRM导航",
            "id": "osrm",
            "provider": "osrm"
        },
        {
            "name": "Myroute导航",
            "id": "myroute",
            "provider": "myroute"
        },
    ],

    

    "centerPoint":[32.045115, 118.778601],  //地图显示的中心点

    "zoom": 15, //初始的地图缩放比例
};