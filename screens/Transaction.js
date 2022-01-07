import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text, 
  ImageBackground,
  Image,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import firebase from "firebase";
import db from "../config";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      bookName: "",
      studentName: ""
    };
  }

  getCameraPermissions = async domState => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true
      });
    }
  };

  handleTransaction = async () => {
    var { bookId, studentId, bookName, studentName } = this.state;
    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);
    console.log('handleing transaction')
    var transaction_type =await this.checkBookAvailiblity(bookId)
    if(! transaction_type){
      alert('this book is not in the libary')
    }

    else if(transaction_type === 'issue'){
      var isEligible = await this.checkStudentEligiblityForIssue(studentId)
      if(isEligible){
      this.initiateBookIssue(bookId, studentId, bookName, studentName)
    }}else{
      var isEligible = await this.checkStudentEligiblityForReturn(studentId,bookId)
      if(isEligible ){
        
      this.initiateBookReturn(bookId, studentId, bookName, studentName)
    }}
  };

  checkBookAvailiblity = async bookId =>{
    const bookref = await  db.collection('books')
    .where('bookId','==',bookId).get()
    var transaction_type = ''
    if(bookref.docs.length === 0){transaction_type = false}else{
      bookref.docs.map((doc)=>{transaction_type = doc.data().availiblity ? 'issue' : 'return'}     
      )
    }
    return transaction_type
  }
  checkStudentEligiblityForReturn = async (studentId,bookId)=>{
    const trans_ref = await db.collection('transactions').where('bookId','==',bookId)
    .limit(1).get()
    var studentEligible = ''
    trans_ref.docs.map((doc)=>{
      var lastTransaction=doc.data()
      if(lastTransaction.studentId === studentId ){
        studentEligible = true
      }else{ studentEligible = false;alert('you didnt issue this book');
    this.setState({studentId:'',bookId:''})}
    })
    return studentEligible
  }
  
  checkStudentEligiblityForIssue = async studentId =>{
    const studentRef = await db.collection('students').where('studentId','==',studentId).get()
    var studentEligible =''
    if(studentRef.docs.length === 0){studentEligible = false;
      alert('you have exsistential crisis,you dont exist');
      this.setState({studentId:'',bookId:''});     
    }else (studentRef.docs.map((doc)=>
    {
      if(doc.data().bookIssued <2){
        studentEligible = 'false'
      }else{studentEligible = 'true';alert('you have 2 books issued')}    
    }))
    return studentEligible
 }

  getBookDetails =async bookId => {
    console.log('book details')
    bookId = bookId.trim();
    db.collection("books")
      .where("bookId", "==", bookId)
      .get()
      .then(snapshot => { 
        snapshot.docs.map(doc => {
          this.setState({
            bookName: doc.data().name
          });
        });
      });
  };

  getStudentDetails =async studentId => {
    console.log('stealing students data')
    studentId = studentId.trim();
    db.collection("students")
      .where("studentId", "==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            studentName: doc.data().name
          });
        });
      });
  };

  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    //add a transaction
    alert('issue d')
    db.collection("transactions").add({
      studentId: studentId,
      studentName: studentName,
      bookId: bookId,
      bookName: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue"
    });
    //change book status
    db.collection("books")
      .doc(bookId)
      .update({
        availiblity: false
      });
    //change number  of issued books for student
    db.collection("students")
      .doc(studentId)
      .update({
        bookIssued: firebase.firestore.FieldValue.increment(1)
      });

    // Updating local state
    this.setState({
      bookId: "",
      studentId: ""
    });
  };

  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    //add a transaction
    alert('re turned')
    db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return"
    });
    //change book status
    db.collection("books")
      .doc(bookId)
      .update({
        availiblity: true
      });
    //change number  of issued books for student
    db.collection("students")
      .doc(studentId)
      .update({
        bookIssued: firebase.firestore.FieldValue.increment(-1)
      });

    // Updating local state
    this.setState({
      bookId: "",
      studentId: ""
    });
  };

  render() {
    const { bookId, studentId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <View style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"Book Id"}
                onChangeText={(text)=>{this.setState({bookId:text})}}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"Student Id"}
                onChangeText={(text)=>{this.setState({studentId:text})}}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, { marginTop: 25 }]}
              onPress={this.handleTransaction}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  appName: {
    width: 80,
    height: 80,
    resizeMode: "contain"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 24,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold"
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F48D20",
    borderRadius: 15
  },
  buttonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Rajdhani_600SemiBold"
  }
});
