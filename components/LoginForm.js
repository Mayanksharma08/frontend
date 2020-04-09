import React, { Component } from 'react';
import { Text, StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';


export default class LoginForm extends Component {
    render() {
        return (
            <React.Fragment>
                <View style={styles.inputView}>
                    <TextInput  
                        style={styles.inputText}
                        placeholder="Email..."
                        keyboardType="email-address" 
                        autoCapitalize="none"
                        placeholderTextColor="#003f5c"
                        value={this.props.email}
                        onChangeText={email => this.props.handleChange("email",email)}
                    />
                </View>
                <View style={styles.inputView}>
                    <TextInput  
                        secureTextEntry
                        style={styles.inputText}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Password..." 
                        placeholderTextColor="#003f5c"
                        value={this.props.password}
                        onChangeText={pw => {this.props.handleChange("password",pw)}}
                    />
                </View>
                <TouchableOpacity onPress={this.props.handleSignIn}
                    style={styles.loginBtn}
                >
                    <Text style={styles.loginText}>LOGIN</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.props.handleSignUp}>
                    <Text style={styles.loginText}>Signup</Text>
                </TouchableOpacity>
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    inputView:{
        width:"80%",
        backgroundColor:"#465881",
        borderRadius:25,
        height:50,
        marginBottom:20,
        justifyContent:"center",
        padding:20
      },
      inputText:{
        height:50,
        color:"white"
      },
      loginBtn:{
        width:"80%",
        backgroundColor:"#fb5b5a",
        borderRadius:25,
        height:50,
        alignItems:"center",
        justifyContent:"center",
        marginTop:10,
        marginBottom:10
      },
      loginText:{
        color:"white"
      }
})