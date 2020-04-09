import React, { Component } from 'react';
import LoginForm from '../components/LoginForm';
import axios from "axios";
import baseUrl from '../baseUrl';
import { Text, View, StyleSheet, Alert,Image } from 'react-native';
axios.defaults.baseURL = baseUrl;

export default class Login extends Component {

    constructor(props){
        super(props);
        this.state= {
            email: "",
            password:"",
            errorMessage: ""
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleSignUp = this.handleSignUp.bind(this);
    }

    handleChange(name,value) {
        this.setState({
            [name]:value
        })
    }

    async handleSignUp() {
        try {
            console.log("OK")
            const { email, password } = this.state;
            
            await axios.post("/auth/signup",{email,password});
            this.handleSignIn();
        } catch(error) {
            this.setState({ errorMessage: error.response.data.message });
        }
    }

    async handleSignIn() {
        try{
            this.setState({errorMessage: ""});
            const {email,password} = this.state;
            const result = await axios.post("/auth/login",{email,password});
            this.props.handleChange("token",result.data.token);
        } catch(error){
            this.setState({errorMessage: error.response.data.message});
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require("../images/car.png")} style={styles.logo} />
                <Text style={styles.headerText}> L I F T A X I </Text>
                <LoginForm email={this.state.email} 
                password={this.state.password}
                handleChange = {this.handleChange}
                handleSignIn = {this.handleSignIn}
                handleSignUp = {this.handleSignUp}
                />
                <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#003f5c',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerText:{
        fontSize: 44,
        color:"#C1D764",
        textAlign: "center",
        marginBottom:0,
        fontWeight: "200"
    },
    errorMessage: {
        marginHorizontal: 10,
        marginTop: 30,
        fontSize: 15,
        fontFamily:"Roboto",
        textTransform: "uppercase",
        letterSpacing: 2,
        textAlign:"center",
        color: "#F5D7CC",
        fontWeight: "bold",
        paddingRight:4,
        paddingLeft:4,
        backgroundColor: "#465881",
        borderRadius:15,
        justifyContent:"center"
    },
    logo:{
        marginRight:50,
        marginBottom:-110,
        height:300,
        width:300
    }
});
