import React, { Component } from 'react';
import { Text, StyleSheet, View,Image,TouchableOpacity } from 'react-native';
import { BackHandler } from 'react-native';



export default class DriverOrPassenger extends Component {

    constructor(props) {
        super(props)
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    }
    
    componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }
    
    handleBackButtonClick() {
        this.props.navigation.goBack(null);
        return true;
    }
    
    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity 
                onPress ={() => this.props.handleChange("isDriver",true)}
                style={[styles.choiceContainer, {borderBottomWidth: 1}]}>
                    <Text style={styles.choiceText}>D R I V E R</Text>
                    <Image source={require("../images/driver.png")} 
                    style={styles.selectionImage}
                    />
                </TouchableOpacity>
                <TouchableOpacity 
                onPress ={() => this.props.handleChange("isPassenger",true)}
                style={[styles.choiceContainer]}>
                    <Text style={styles.choiceText}>P A S S E N G E R</Text>
                    <Image source={require("../images/passenger.png")} 
                    style={styles.selectionImage}
                    />
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#003f5c"
    },
    choiceText:{
        fontSize:20,
        marginBottom:20,
        fontWeight: "200",
        color:"#fff"
    },
    choiceContainer: {
        flex: 1,
        borderColor:"#fff",
        alignItems: "center",
        justifyContent: "center"
    },
    selectionImage: {
        height:200,
        width: 200
    }
});
