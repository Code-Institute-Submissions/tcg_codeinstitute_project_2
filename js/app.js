$(document).ready(function () {
  var userstartbscode = "waiting for user input...";
  var userdestbscode = "waiting for user input...";
  var queryResult = []; // to only store result as data source for autocomplete
  var querydata = []; // to store all the busstop info (roadname,description,bscode) from the api calls
  let centerlat = 1.3544; // default latitude setting when the map is first loaded
  let centerlong = 103.82; // default longtitude setting when the map is first loaded
  var mapzoom = 10; // default zoom setting when the map is first loaded
  var mapstart = 0; // to load the map at default page which will show the entire of Singapore land mass
  var gculat = 0;
  var gculong = 0;
  var map;
  var bscode;
  var busstopclickedlat;
  var busstopclickedlong;
  var fromlat = 0;
  var fromlong = 0;

  getmap(mapzoom, centerlong, centerlat);

  // this array is declared due to pagination of the api, which will only publish the first 500 apis by default
  var busstopnoapicalls = [
    0,
    500,
    1000,
    1500,
    2000,
    2500,
    3000,
    3500,
    4000,
    4500,
    5000,
  ];

  // to get the next 500 api calls using loop
  busstopnoapicalls.forEach(function (apicalls) {
    var settings = {
      url:
        "http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=" +
        apicalls,
      // "https://tcg-cors-proxy.herokuapp.com",
      method: "GET",
      timeout: 0,
      headers: {
        AccountKey: "T+n6csk3Rd6vj7in0YOctw==",
        Accept: "application/json",
        // 'Target-Url':'http://datamall2.mytransport.sg/ltaodataservice/BusStops',
      },
    };

    $.ajax(settings)
      .done(function (response) {
        var roadname;
        var landmark;
        var busstopcode;
        // var lat;
        // var long;
        for (var i = 0; i < response.value.length; i++) {
          roadname = response.value[i].RoadName;
          landmark = response.value[i].Description;
          busstopcode = response.value[i].BusStopCode;
          lat = response.value[i].Latitude;
          long = response.value[i].Longitude;
          queryResult.push(
            // `${landmark} near ${roadname} (Bus Stop Code: ${busstopcode}) - [${lat},${long}])`
            `${landmark} near ${roadname} (Bus Stop Code: ${busstopcode})`
          );
          querydata.push(response.value[i]);
        }
      })
      .fail(function (xhr, status, error) {
        //to give prompt if api server fail
        var errorMessage = xhr.status + ": " + xhr.statusText;
        console.log("Error - " + errorMessage);
        $("#toast").html(
          `<h5>Api server error! The page will auto refresh in 5 sec or you can force refresh now.</5>`
        );
        $("#toast").addClass("show");
        setTimeout(function () {
          $("#toast").removeClass("show").addClass("");
        }, 5000);
        window.setTimeout(function () {
          window.location.reload();
        }, 5000);
      });
  });

  // to provide autocomplete of address when user starts to type more than 1 character
  $("#FromQuery").autocomplete({
    source: queryResult,
    minLength: 4,
    select: function (event, ui) {
      console.log(ui.item.value);
      var res = ui.item.value.split("Bus Stop Code: ");
      userstartbscode = res[1].slice(0, -1);
      console.log(userdestbscode);
    },
  });

  $("#ToQuery").autocomplete({
    source: queryResult,
    minLength: 4,
    select: function (event, ui) {
      console.log(ui.item.value);
      var res = ui.item.value.split("Bus Stop Code: ");
      userdestbscode = res[1].slice(0, -1);
      console.log(userdestbscode);
    },
  });

  $("#usercurrentloc").click(function () {
    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
      $("#toast").html(
        `<h5>Api server error! The page will auto refresh in 5 sec or you can force refresh now.</5>`
      );
      $("#toast").addClass("show");
      setTimeout(function () {
        $("#toast").removeClass("show").addClass("");
      }, 5000);
      window.setTimeout(function () {
        window.location.reload();
      }, 5000);
    }

    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    $("#destcard").remove();
    $(`#markerdest`).remove();
    $(`#markerstart`).remove();
    $(`#marker`).remove();

    if (navigator.geolocation) {
      //check geolocation available
      //try to get user current location using getCurrentPosition() method
      navigator.geolocation.getCurrentPosition(
        function (position) {
          gculat = position.coords.latitude;
          gculong = position.coords.longitude;
          var nearby = false;
          mapzoom = 16;
          makedommarker(
            map,
            "markerhere",
            "images/uarehere.svg",
            "40",
            "40",
            gculong,
            gculat
          );
          map.flyTo({
            center: [gculong, gculat],
            zoom: mapzoom,
          });

          console.log(`gculat: ${gculat} gculong: ${gculong}`);
          fromlong = gculong;
          fromlat = gculat;

          for (var i = 0; i < querydata.length; i++) {
            // if this location is within 0.1KM of the user, add it to the list
            if (
              distance(
                gculat,
                gculong,
                querydata[i].Latitude,
                querydata[i].Longitude,
                "K"
              ) <= 0.12
            ) {
              console.log(
                `The nearest bus stop to your current location is ${querydata[i].Description} along ${querydata[i].RoadName} (${querydata[i].BusStopCode})`
              );
              var loclong = querydata[i].Longitude;
              var loclat = querydata[i].Latitude;

              console.log(querydata[i].BusStopCode);
              bscode = querydata[i].BusStopCode;
              var description = querydata[i].Description;
              var roadname = querydata[i].RoadName;

              $(`#FromQuery`).val(
                `${description} near ${roadname} (Bus Stop Code: ${bscode})`
              );

              // to update the card component with closest bus stop info
              busstopcardinfo(
                bscode,
                description,
                roadname,
                querydata,
                "Selected Bus Stop Nearest To You"
              );

              // to create custom marker when selected a bus stop
              makedommarker(
                map,
                "markerstart",
                "images/startsign.svg",
                "71",
                "57",
                loclong,
                loclat
              );
              nearby = true;
              break;
            } 
          }

          if(nearby===false){
            $("#toast").html(
              `<h5>There are no bus stop within 120 m of your location. Please go to somewhere else.</5>`
            );
            $("#toast").addClass("show");
            setTimeout(function () {
              $("#toast").removeClass("show").addClass("");
            }, 5000);
          }

        },
        error,
        options
      );
    } else {
      console.log("Browser doesn't support geolocation!");
    }
  });

  // to retrieve user location using geolocation when clicked onto the form query and update onto the map
  $("#FromQuery").click(function () {
    console.log(`FromQuery is working`);
    gculong = 0;
    gculat = 0;

    $("#destcard").remove();
    // clear all previous markers
    $(`#markerdest`).remove();
    $(`#markerstart`).remove();
    $(`#markerhere`).remove();
    $(`#marker`).remove();
    $(`#buslocmarker`).remove();
    $(`#FromQuery`).val(``);
    $(
      ".card"
    ).html(`<div class="botcolor card-header">Please click onto any of the bus stop on the map to display the
    bus stop
    code no and nearby building/amenties.</div>
<div class="botcolor card-body">
    <p>Please click onto any of the bus stop on the map to display the bus service no. at the bus
        stop.</p>
</div>`);
    // $("#guides").html(
    //   "<p>Please provide a nearby road name / street name / bus stop code</p>"
    // );

    map.flyTo({
      center: [centerlong, centerlat],
      zoom: 11,
    });
  });

  $("#ToQuery").click(function () {
    console.log(`ToQuery is working`);
    console.log(`gculong:${gculong}   gculat:${gculat}`);
    var toqzoom = 11;

    // clear all previous markers
    $(`#markerdest`).remove();
    $(`#marker`).remove();
    $(`#buslocmarker`).remove();

    $("#destcard").remove();
    // $("#guides").html(
    //   "<p>Please provide a nearby road name / street name / bus stop code</p>"
    // );
    $(`#ToQuery`).val(``);

    if (gculat != 0 && gculong != 0) {
      toqzoom = 16;
      map.flyTo({
        center: [gculong, gculat],
        zoom: toqzoom,
      });
    } else
    {
      gculat = 0;
      gculong = 0;
      map.flyTo({
        center: [centerlong, centerlat],
        zoom: toqzoom,
      });
    }
  });

  $("#searchbutton").on("click", (e) => {
    console.log(querydata.length);
    console.log(`gculat: ${gculat} gculong: ${gculong}`);
    var destlong = 0;
    var destlat = 0;
    var startlong = 0;
    var startlat = 0;
    var description = "";
    var roadname = "";

    var value = $("#FromQuery").val();
    if (value != 0) {
      var res = value.split("Bus Stop Code: ");
      userstartbscode = res[1].slice(0, -1);
    }

    console.log(`found userstartbscode >>> ${userstartbscode}`);

    /* to loop through the querydata to find the lng and lat of the nearest stop to 
    the user current loc and destination and push to an array markercoords to generate markers*/
    for (var i = 0; i < querydata.length; i++) {
      // to handle empty value passed back to userdestcode

      if (userdestbscode == NaN) {
        e.preventDefault();
      } else if (querydata[i].BusStopCode == userstartbscode) {
        console.log(`found userstartbscode`);
        startlong = querydata[i].Longitude;
        startlat = querydata[i].Latitude;
      } else if (querydata[i].BusStopCode == userdestbscode) {
        destlong = querydata[i].Longitude;
        destlat = querydata[i].Latitude;
        description = querydata[i].Description;
        roadname = querydata[i].RoadName;
      }
    }
    busstopcardinfo(
      userstartbscode,
      description,
      roadname,
      querydata,
      "Selected Bus Stop"
    );
    destcardinfo(userdestbscode, description, roadname, querydata);

    makedommarker(
      map,
      "markerstart",
      "images/startsign.svg",
      "71",
      "57",
      startlong,
      startlat
    );
    makedommarker(
      map,
      "markerdest",
      "images/stopsign.svg",
      "71",
      "57",
      destlong,
      destlat
    );
    if (destlong != 0 || destlat != 0) {
      map.flyTo({
        center: [destlong, destlat],
        zoom: 16,
      });
    }
  });

  // to find the location of the bus when clicked on the service no
  $("div").on("click", "#bussvcbtn", function () {
    console.log(`.card-body is clicked`);
    var busno = $(this).text();
    bscode = $(`#bscodebtn`).text();
    busloc(bscode, busno, map);
    // if (gculat != 0 && gculong != 0) {
    //   busloc(bscode, busno, map);
    // } else {
    //   busloc(userstartbscode, busno, map);
    // }
  });

  // to find the location of the bus when clicked on the service no
  $("div").on("click", "#destbussvcbtn", function () {
    console.log(`destcardbody is clicked`);
    bscode = $(`#destbscodebtn`).text();
    var busno = $(this).text();
    busloc(bscode, busno, map);
  });

  // to show the help modal
  $(`#helpmebtn`).on("click",()=>{
    console.log(`helpmebtn is clicked!`)
    helpmodal()
  });

  // function to generating map using mapbox api
  function getmap(mapzoom, gculong, gculat) {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic2ltcGx5ZWR3aW4iLCJhIjoiY2tpcmUycDI1MDZzczJ3cnh3cGx4NHZoYyJ9.h4T1J2-6QQW7-bRJZuwJrg";
    map = new mapboxgl.Map({
      container: "map", // container id
      style: "mapbox://styles/simplyedwin/ckjdrlk8o054m19qjmihsxqe7", //"mapbox://styles/mapbox/streets-v11", // style URL
      center: [gculong, gculat], // starting position [lng, lat]
      zoom: mapzoom, // starting zoom
    });

    // to retrieve user location using mapbox build in feature
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );

    // to interact with the bus stop layer "fullbuststopcode" on the map
    map.on("click", "fullbuststopcode", function (e) {
      $("#destcard").remove();
      $(`#buslocmarker`).remove(); // to remove the previous bus location marker when clicked from different bus stop
      var features = map.queryRenderedFeatures(e.point, {
        layers: ["fullbuststopcode"], // replace this with the name of the layer (used name of the tiledata in mapbox studio)
      });

      if (!features.length) {
        return;
      }
      var feature = features[0];
      bscode = feature.properties.busstopcode;
      var roadname = feature.properties.roadname;
      var description = feature.properties.description;
      console.log(`bscode: ${bscode}`);
      busstopcardinfo(
        bscode,
        description,
        roadname,
        querydata,
        "Selected Bus Stop"
      );

      // to create custom marker when selected a bus stop
      makedommarker(
        map,
        "marker",
        "images\\clickedmarker.svg",
        "61",
        "47",
        busstopclickedlong,
        busstopclickedlat
      );
      map.flyTo({
        center: [busstopclickedlong, busstopclickedlat],
        zoom: 16,
      });

      console.log(
        `Busstop code:${feature.properties.busstopcode} 
  Description:${feature.properties.description} 
  Roadname:${feature.properties.roadname}`
      );
    });
  }

  // to compute the distance between 2 coordiates
  function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }

  // function to find bus service no at a bus stop using bus stop code
  function busloc(bscode, busno, map = "") {
    console.log(`busloc func is called with ${bscode}`);
    var settings = {
      url:
        // "https://cors-anywhere.herokuapp.com/http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
        "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
        bscode,
      method: "GET",
      timeout: 0,
      headers: {
        AccountKey: "T+n6csk3Rd6vj7in0YOctw==",
        Accept: "application/json",
      },
    };

    $.ajax(settings).done(function (response) {
      var apiservices = response.Services;
      console.log(apiservices);
      for (var i = 0; i < apiservices.length; i++) {
        var svcbusno = apiservices[i].ServiceNo;
        var nextbus = apiservices[i].NextBus;
        var nextbuslong = nextbus.Longitude;
        var nextbuslat = nextbus.Latitude;
        console.log(`Bus in service: ${svcbusno} Bus clicked: ${busno} Current loc (long,lat): ${nextbuslong} ${nextbuslat}
        Busstop loc (long,lat): ${busstopclickedlong} ${busstopclickedlat}`);
        //to inform the user if the bus location cannot be determined
        if (svcbusno === busno && nextbuslong == 0 && nextbuslat == 0) {
          console.log("The bus is not in operation");
          $("#toast").html(
            `<h5>The bus may not be in service at this moment. Please try again later.</5>`
          );
          $("#toast").addClass("show");
          setTimeout(function () {
            $("#toast").removeClass("show").addClass("");
          }, 4000);
          //to prevent the bus to appear at long and lat of (0,0)
          map.flyTo({
            center: [busstopclickedlong, busstopclickedlat],
          });
        } else if (svcbusno === busno) {
          console.log("The bus is in operation");
          map.flyTo({
            center: [nextbuslong, nextbuslat],
            zoom: 16,
          });
          makedommarker(
            map,
            "buslocmarker",
            "images/bus-vehicle.svg",
            "41",
            "27",
            nextbuslong,
            nextbuslat,
            busno
          );
        }
      }
    });
  }

  //function to create a custom map marker using DOM element
  function makedommarker(
    map,
    markerid,
    imgsrc,
    width,
    height,
    clickedlong,
    clickedlat,
    busno = ""
  ) {
    $(`#${markerid}`).remove(); // to remove the previous marker when clicked from same bus stop
    var el = document.createElement("div");
    el.id = markerid;
    var imgsvg = document.createElement("img");
    imgsvg.src = imgsrc;
    // do not include any unit for height and width
    imgsvg.height = height;
    imgsvg.width = width;
    // to make sure the p element will only appear for the bus location marker to show the bus no
    if (markerid === "buslocmarker") {
      var para = document.createElement("p");
      para.id = "paramarker";
      var node = document.createTextNode(busno);
      para.appendChild(node);
      el.appendChild(imgsvg);
      el.appendChild(para);
    } else {
      el.appendChild(imgsvg);
    }
    var marker = new mapboxgl.Marker(el);
    marker.setLngLat([clickedlong, clickedlat]).addTo(map);
  }

  //  function to fill up the card component with the "FROM" bus stop information
  function busstopcardinfo(
    bscode,
    description,
    roadname,
    querydata = "",
    cardtitle,
    source = "s"
  ) {
    $(".card-header").html(
      `
      <p class="card-text overflow-auto" id ="buscardheader">
      <h4>${cardtitle}</h4><hr>      
      <div class="row justify-content-around">
      <div class="col-sm-12">
            <h5 >Bus Stop Code: 
            <button style="font-weight:bold; color:blue;" id="bscodebtn" >${bscode}
            <img src="images/AlightLiaoLah_Busstop.svg" class="img-fluid" alt="busstop log" width="54px" height="42px" style="margin-left:10px;">
            </button> 
            </h5> 
            </div>
            </div>

      <div class="row justify-content-around">

            <div class="col">            
            <h5>${description} along ${roadname}</h5>
            </div>
            </p>
        </div>`
    );
    $(".card-body").html(
      `<p class="card-text overflow-auto" id ="bussvcbtncard"></p>`
    );

    // to retrieve the bus service number at the bus stop and create clickable bus service number buttons
    console.log(`busstopcardinfo func is running`);
    bussvcnos(bscode);

    // to retrieve lat and long of the selected bus stop

    if (querydata.length >= 1) {
      for (var i = 0; i < querydata.length; i++) {
        if (querydata[i].BusStopCode == bscode) {
          busstopclickedlat = querydata[i].Latitude;
          busstopclickedlong = querydata[i].Longitude;
          $(".card-header button").css({ background: "none", border: "none" });
          $(".card-header").on("click", "button", () => {
            $(".card-header button:focus").css({ outline: "none" });
            //to center the focus on the bus stop when clicked onto the bus code number
            map.flyTo({
              center: [busstopclickedlong, busstopclickedlat],
            });
          });
        }
      }
    } else {
      $(".card-header button").css({ background: "none", border: "none" });
      $(".card-header").on("click", "button", () => {
        $(".card-header button:focus").css({ outline: "none" });
      });
    }
  }

  //  function to fill up the card component with the "TO" bus stop information
  function destcardinfo(bscode, description, roadname, querydata = "") {
    $("#destcard").remove();

    $("#carddiv").append(
      `
        <div class="card text-dark bg-light mb-3" style="max-width: 100rem;" id="destcard">
          <div class="botcolor card-header">
      
              <p class="card-text overflow-auto" id="buscardheader">
              <h4>Selected Destination Bus Stop</h4>
              <hr>
              <div class="row justify-content-around">
                  <div class="col-sm-12" id="destbscbody">
                      <h5>Bus Stop Code:
                          <button style="font-weight:bold; color:blue;"id="destbscodebtn" >${bscode}
                              <img src="images/AlightLiaoLah_Busstop.svg" class="img-fluid" alt="busstop log" width="54px"
                                  height="42px" style="margin-left:10px;">
                          </button>
                      </h5>
                  </div>
              </div>
      
              <div class="row justify-content-around" id="destbussvcbtncard">
      
                  <div class="col">
                      <h5>${description} along ${roadname}</h5>
                  </div>
                  </p>
              </div>
          </div>
          <div class="botcolor card-body">
              <p class="card-text overflow-auto" id="destbussvcbtncard"></p>
          </div>
    </div>  
    `
    );

    // to retrieve the bus service number at the bus stop and create clickable bus service number buttons
    console.log(`busstopcardinfo func is running`);
    bussvcnos(bscode, "d");

    // to retrieve lat and long of the selected bus stop

    if (querydata.length >= 1) {
      for (var i = 0; i < querydata.length; i++) {
        if (querydata[i].BusStopCode == bscode) {
          var destbsclickedlat = querydata[i].Latitude;
          var destbsclickedlong = querydata[i].Longitude;
          $("#destbscbody button").css({ background: "none", border: "none" });
          $("#destbscbody").on("click", "button", () => {
            $("#destbscbody button:focus").css({ outline: "none" });
            //to center the focus on the bus stop when clicked onto the bus code number
            map.flyTo({
              center: [destbsclickedlong, destbsclickedlat],
            });
          });
        }
      }
    } else {
      $("#destbscbody button").css({ background: "none", border: "none" });
      $("#destbscbody").on("click", "button", () => {
        $("#destbscbody button:focus").css({ outline: "none" });
      });
    }
  }

  // function to find bus service no at a bus stop using bus stop code
  function bussvcnos(bscode, source) {
    var settings = {
      url:
        // "https://cors-anywhere.herokuapp.com/http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
        "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
        bscode,
      method: "GET",
      timeout: 0,
      headers: {
        AccountKey: "T+n6csk3Rd6vj7in0YOctw==",
        Accept: "application/json",
      },
    };

    $.ajax(settings).done(function (response) {
      var apibscode = response.BusStopCode;
      var apiservices = response.Services;
      console.log(apiservices);
      for (var i = 0; i < apiservices.length; i++) {
        if (source === "d") {
          var destbussvcbtn = `<button class="btn" type = "button" style="margin:5px; color: white;
          background-color: #083864ff;
          font-weight: bold;" id = "destbussvcbtn">${apiservices[i].ServiceNo}</button>`;
          $("#destbussvcbtncard").after(destbussvcbtn);
        } else {
          var bussvcbtn = `<button class="btn" type = "button" style="margin:5px; color: white;
          background-color: #083864ff;
          font-weight: bold;" id = "bussvcbtn">${apiservices[i].ServiceNo}</button>`;
          $("#bussvcbtncard").after(bussvcbtn);
        }
      }
    });
  }

  //function for the help modal
  function helpmodal(){
    $(`#helpme`).html(
      `<!-- Modal -->
      <div class="modal fade" id="helpmeModal" tabindex="-1" role="dialog" aria-labelledby="helpmeModalTitle"
          aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered" role="document">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title" id="exampleModalLongTitle">Modal title</h5>
                      <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                      </button>
                  </div>
                  <div class="modal-body">
                      ...
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                      <button type="button" class="btn btn-primary">Save changes</button>
                  </div>
              </div>
          </div>
      </div>`
    );
  }

  // function to create a pulsing dot object on the map
  function pulsingDot(map, size, r, g, b, a) {
    console.log(`pulsingDot is called`);

    // this.map = map;
    this.width = size;
    this.height = size;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.data = new Uint8Array(size * size * 4);

    this.onAdd = function () {
      console.log(`onAdd is called`);
      var canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext("2d");
    };

    this.render = function () {
      console.log(`render is called`);
      var duration = 1000;
      var t = (performance.now() % duration) / duration;

      var radius = (size / 2) * 0.3;
      var outerRadius = (size / 2) * 0.7 * t + radius;
      var context = this.context;

      // draw outer circle
      context.clearRect(0, 0, this.width, this.height);
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
      a = 1 - t;
      context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")"; //"rgba(255, 200, 200," + (1 - t) + ")";
      //context.fillStyle = "rgba(255, 200, 200," + (1 - t) + ")";
      context.fill();

      // draw inner circle
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle =
        "rgba(" + r + "," + (g - g / 2) + "," + (b - b / 2) + ",1)"; //"rgba(255, 100, 100, 1)";
      //context.fillStyle = "rgba(255, 100, 100, 1)";
      context.strokeStyle = "white";
      context.lineWidth = 2 + 4 * a;
      context.fill();
      context.stroke();

      // update this image's data with data from the canvas
      this.data = context.getImageData(0, 0, this.width, this.height).data;

      // continuously repaint the map, resulting in the smooth animation of the dot
      map.triggerRepaint();
      console.log(`triggerRepaint is called`);

      // return `true` to let the map know that the image was updated
      return true;
    };
  }
});
