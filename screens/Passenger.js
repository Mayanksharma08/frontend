import React, {Component} from 'react';
import { StyleSheet, Text, TextInput, View, TouchableHighlight, Image, Keyboard, ActivityIndicator } from 'react-native';
import MapView, {Polyline,Marker} from 'react-native-maps';
import BottomButton from "../components/BottomButton";
import {apiKey} from '../google_api_key';
import _ from 'lodash';
import * as Location from 'expo-location';
import PolyLine from '@mapbox/polyline';
import socketIO from 'socket.io-client';


export default class Passenger extends Component {
    constructor(props){
        super(props);
        this.state={
            error:"",
            latitude:null,
            longitude:null,
            destination:"",
            predictions: [],
            pointCoords: [],
            routeResponse: {},
            lookingForDriver: false,
            driverIsOnTheWay: false,
            driverLocation:{}
        };
        this.onChangeDestinationDebounced = _.debounce(
          this.onChangeDestination, 1000);
    }
    
    componentDidMount = async () => {

      this.watchId = navigator.geolocation.watchPosition(
        position => {
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        error => console.error(error),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
      );
    };

    componentWillUnmount() {
      navigator.geolocation.clearWatch(this.watchId);
    }

    async getRouteDirections(placeId,destinationName) {
      try{
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${placeId}&key=${apiKey}`
        );
        const json = await response.json();
        const points = PolyLine.decode(json.routes[0].overview_polyline.points);
        const pointCoords = points.map(point => {
          return {latitude: point[0],longitude: point[1]}; 
        });
        this.setState({pointCoords,
          predictions: [],
          destination: destinationName,
          routeResponse: json
        });
        Keyboard.dismiss();
        this.map.fitToCoordinates(pointCoords
         // ,{edgePadding: {top:20, bottom: 20, left: 20, right: 20}}
         );
      } catch (err){
        console.log(err);
      }
    }

    async onChangeDestination(destination) {
      this.setState({destination});
      const apiUrl= `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}&input=${destination}&location=${this.state.latitude},${this.state.longitude}&radius=2000`;
      try{
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions:json.predictions
      });
      } catch(err) {
        console.error(err);
      }
    }

    async requestDriver(){
      this.setState({lookingForDriver: true})
      const socket = socketIO.connect("https://socketio-backend.azurewebsites.net");        
      
      socket.on("connect",() => {
        console.log("client connected")
        //Req taxi
        socket.emit("taxiRequest",this.state.routeResponse);
      });

      socket.on("driverLocation",driverLocation =>{
        let pointCoords = [...this.state.pointCoords,driverLocation];
        this.map.fitToCoordinates(pointCoords,
          {edgePadding: {top:20, bottom: 20, left: 20, right: 20}}
          );
        this.setState({lookingForDriver:false, 
        driverIsOnTheWay: true,
        driverLocation
      });
      });
      setTimeout(()=> {
        this.requestDriver();
      },2000);
    }
    
    render(){
      let marker=null;
      let findingDriverActIndicator=null;
      let getDriver=null;
      let driverMarker=null;

      if(this.state.latitude === null) return null;

      if(this.state.driverIsOnTheWay){
        console.log(this.state.driverLocation);
        driverMarker = (
          <Marker coordinate={this.state.driverLocation}>
            <Image
            style={{ width: 40, height: 40 }}
            source={require("../images/carIcon.png")}
          />
          </Marker>
        );
      }

      if(this.state.lookingForDriver){
        findingDriverActIndicator = (
        <ActivityIndicator
          size="large"
          animating={this.state.lookingForDriver}
        />);
      }

      if(this.state.pointCoords.length>1){
        marker=(
        <Marker coordinate={this.state.pointCoords[this.state.pointCoords.length-1]}/>
        );
        getDriver=(
        <BottomButton
        onPressFunction={()=> this.requestDriver()}
        buttonText="REQUEST 🚗"
        >
          {findingDriverActIndicator}
        </BottomButton>
        );
      }
      const predictions = this.state.predictions.map(prediction => 
      <TouchableHighlight 
      onPress={()=> this.getRouteDirections(prediction.place_id,prediction.structured_formatting.main_text)}
      key={prediction.id}
      >
      <View>
      <Text style={styles.suggestions}>
        {prediction.structured_formatting.main_text}
      </Text>
      </View>
      </TouchableHighlight>
      )
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
              {marker}
              {driverMarker}
            </MapView>
            
            <TextInput placeholder="Enter destination..." 
              style={styles.destinationInput}
              value={this.state.destination} 
              onChangeText={destination => {
                this.setState({ destination });
                 this.onChangeDestinationDebounced(destination);
              }} />
              {predictions}
              {getDriver}
          </View>
      );
}
}


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
