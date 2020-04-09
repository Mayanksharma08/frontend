import React, {Component} from 'react';
import { StyleSheet, Text, TextInput, View, Image, ActivityIndicator, Linking, Platform } from 'react-native';
import MapView, {Polyline,Marker} from 'react-native-maps';
import BottomButton from "../components/BottomButton";
import {apiKey} from '../google_api_key';
import _ from 'lodash';
import PolyLine from '@mapbox/polyline';
import socketIO from 'socket.io-client';
import {Notifications} from 'expo';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService } from './locationService';

const LOCATION_TRACKER = 'background-location';

export default class Driver extends Component {
    constructor(props){
        super(props);
        this.state={
            error:"",
            latitude:null,
            longitude:null,
            pointCoords: [],
            LookingForPassengers:false,
            buttonText:"FIND PASSENGER"
        };
        this.acceptPassengerRequest = this.acceptPassengerRequest.bind(this);
        this.findPassengers = this.findPassengers.bind(this);
        this.socket = null;
    }

    onLocationUpdate = ({ latitude, longitude }) => {
      this.setState({
        latitude: latitude,
        longitude: longitude
      })
    }  
    
    componentDidMount = async () => {
      Location.requestPermissionsAsync();
      if (Platform.OS === "android") {
        Notifications.createChannelAndroidAsync("background-location", {
          name: "Liftaxi",
          priority: "max",
          sound: true,
          vibrate: [0, 250, 500, 250]
        });
      }

      Notifications.presentLocalNotificationAsync({
        title: 'Liftaxi',
        body: 'App is fetching location in background..',
        android: {
          channelId: 'background-location',
        },
      });
      
        this.watchId = navigator.geolocation.watchPosition( position => {
            this.setState({
           longitude: position.coords.longitude, 
           latitude: position.coords.latitude 
        });
        locationService.subscribe(this.onLocationUpdate)
        this.onLoad();
        this.getRouteDirections();
        },
        error => this.setState({error: error.message}),
        {enableHighAccuracy:true, maximumAge: 2000, timeout: 20000}
       );
    }
  
    componentWillUnmount() {
      locationService.unsubscribe(this.onLocationUpdate)
      navigator.geolocation.clearWatch(this.watchId);
    }

    onLoad = async () => {
      let isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKER)
      if(!isRegistered) await Location.startLocationUpdatesAsync(LOCATION_TRACKER, {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5
      });
    }

    async getRouteDirections(placeId) {
      try{
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${placeId}&key=${apiKey}`
        );
        const json = await response.json();
        
        const points = PolyLine.decode(json.routes[0].overview_polyline.points);
        const pointCoords = points.map(point => {
          return {latitude: point[0],longitude: point[1]}; 
        });
        this.setState({pointCoords, predictions: []});
        this.map.fitToCoordinates(pointCoords
         // ,{edgePadding: {top:20, bottom: 20, left: 20, right: 20}}
         );
      } catch (err){
        console.log(err);
      }
    }

    onPress = async () => {
      console.log('waiting')
      await Location.startLocationUpdatesAsync(LOCATION_TRACKER, {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5
  
      });
  
      console.log('waiting for get task option');
      //const data = await TaskManager.getTaskOptionsAsync(LOCATION_TRACKER)
      //console.log(data);
  
    };

    findPassengers() {
      if(!this.state.LookingForPassengers){
      this.setState({
        LookingForPassengers:true
      });
      this.socket = socketIO.connect("https://socketio-backend.azurewebsites.net");

      this.socket.on("connect", () => {
        this.socket.emit("passengerRequest");
      });

      this.socket.on("taxiRequest", routeResponse => {
        this.getRouteDirections(routeResponse.geocoded_waypoints[0].place_id); 
        this.setState({LookingForPassengers:false, passengerFound: true, routeResponse})
      }); 
    }
  }

    acceptPassengerRequest = () => {
      console.log("location")
      console.log(this.state.latitude);

      //Send driver location
      this.socket.emit("driverLocation",
      {latitude:this.state.latitude,
      longitude: this.state.longitude});
      
      const passengerLocation = this.state.pointCoords[
        this.state.pointCoords.length-1
      ];

      watchCurLocation = () => {
        this.onPress();
        setTimeout(() => {
          this.watchCurLocation();
        }, 2000);
      }   

      if(Platform.OS === 'ios'){
        Linking.openURL(`http://maps.apple.com/?daddr=${passengerLocation.latitude},${passengerLocation.longitude}`);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${passengerLocation.latitude},${passengerLocation.longitude}`);
      }
      setTimeout(() => {
        this.acceptPassengerRequest();
      }, 2000);
    }
    
    render(){
      let startMarker=null;
      let endMarker=null;
      let findingPassengerActIndicator = null;
      let passengerSearchText = "FIND PASSENGERS 👥";
      let bottomButtonFunction = this.findPassengers;

      if(this.state.latitude === null) return null;

      if(this.state.LookingForPassengers) {
        passengerSearchText = "FINDING PASSENGERS...";
        findingPassengerActIndicator = (
          <ActivityIndicator
            size="large"
            animating={this.state.LookingForPassengers}
          />
        );
      }

      if (this.state.passengerFound) {
        passengerSearchText = "FOUND PASSENGER! ACCEPT RIDE?";
        bottomButtonFunction = this.acceptPassengerRequest;
      }

      if(this.state.pointCoords.length>1){
        endMarker=(
        <Marker coordinate={this.state.pointCoords[this.state.pointCoords.length-1]}>
        <Image
            style={{ width: 40, height: 40 }}
            source={require("../images/person-marker.png")}
          />
        </Marker>
        );      
      }

      
      return (
          <View style={styles.container}>
            <MapView
            ref={map => {
              this.map = map;
            }}
            style={styles.map}
            initialRegion={{
              latitude: this.state.latitude,
              longitude: this.state.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }}
            showsUserLocation={true}
            >
              <Polyline
                coordinates={this.state.pointCoords}
                strokeWidth={4}
                strokeColor="red"
              />
              {endMarker}
              {startMarker}
            </MapView>
            <BottomButton
          onPressFunction={bottomButtonFunction}
          buttonText={passengerSearchText}
        >
          {findingPassengerActIndicator}
        </BottomButton>
            
          </View>
      );
    }
  }

    TaskManager.defineTask(LOCATION_TRACKER, ({ data, error }) => {
      if (error) {
        console.log(error)
        // Error occurred - check `error.message` for more details.
        return;
      }
      if (data) {
        const { locations } = data;
       
        // do something with the locations captured in the background
        const { latitude, longitude } = locations[0].coords
        locationService.setLocation({
          latitude,
          longitude
        })
      }
    });

const styles = StyleSheet.create({
  bottomButton: {
    backgroundColor: "black",
    marginTop: "auto",
    margin: 20,
    padding:10,
    paddingLeft: 20,
    paddingRight: 20,
    alignSelf: "center"
  },
  bottomText: {
    color:"white",
    fontSize: 20
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  },
  destinationInput: {
    height:40,
    borderWidth:1,
    padding:5,
    marginTop:50,
    marginLeft:5,
    marginRight:5,
    backgroundColor: "white"
  },    
  container: {
    ...StyleSheet.absoluteFillObject
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});
