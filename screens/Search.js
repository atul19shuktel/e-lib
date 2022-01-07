import React, { Component } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity} from "react-native";
import db from '../config'
import firebase from "firebase";
export default class SearchScreen extends Component {
  constructor(props){    
    super(props)
    this.state={
      allTranstactions:[],
      search:'',
      lastTransaction:null,
    }
  }
  searchTransaction=async(text)=>{
    //text=text.toLowerCase()
    var firstAlpha=text.split('')[0]
    if(firstAlpha === 'b') {
      console.log('yes')
    const transaction = await db.collection('transactions').where('bookId','==',text)
    .limit(7)
    .get().then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          allTranstactions:[...this.state.allTranstactions,doc.data()],
          lastTransaction:doc
        })
      })
    })
    }
    else if(firstAlpha ==='2'){
      const transaction = await db.collection('transactions').where('studentId','==',text)
    .limit(5)
    .get().then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          allTranstactions:[...this.state.allTranstactions,doc.data()],
          lastTransaction:doc
        })
      })
    })
    }else(alert('no'))

  }

  fetchMore=async(text)=>{
    text=text.toLowerCase();
    var firstAlpha=text.split('')[0]
    if(firstAlpha === 'b') {
      console.log('yes')
    const transaction = await db.collection('transactions').where('bookId','==',text)
    .startAfter(this.state.lastTransaction)
    .limit(5)
    .get().then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          allTranstactions:[...this.state.allTranstactions,doc.data()],
          lastTransaction:doc
        })
      })
    })
    }
    else if(firstAlpha ==='s'){
      const transaction = await db.collection('transactions').where('studentId','==',text)
      .startAfter(this.state.lastTransaction)
    .limit(7)
    .get().then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          allTranstactions:[...this.state.allTranstactions,doc.data()],
          lastTransaction:doc
        })
      })
    })
    }else(alert('no'))

  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.upperContainer}> 
        <TextInput style={styles.textinputbox} placeholder={"Enter book id/ student id"} onChangeText={text=>this.setState({search:text})} />
         <TouchableOpacity style={styles.searchButton} 
         onPress={()=>this.searchTransaction(this.state.search)} >
            <Text style={styles.text}>SEARCH</Text> 
            </TouchableOpacity>
         </View>
         <View style={styles.lowerContainer}>
          <FlatList 
          data={this.state.allTranstactions}
          keyExtractor={(item,index)=>{index.toString()}}
          renderItem={({item})=>(
            <View style={{borderBottomWidth:3}}>
             <Text>{'book_name: '+ item.bookName}</Text>
             <Text>{'book_id: '+ item.bookId}</Text>
             <Text>{'student_name: '+ item.studentName}</Text>
             <Text>{'student_id: '+ item.studentId}</Text>
             <Text>{'transaction_type: '+ item.transaction_type}</Text>
             <Text>{'date: '+ item.date.toDate()}</Text>
            </View>
          )}
          onEndReached={()=>{this.fetchMore(this.state.search)}}
          onEndReachedThreshold={0.7}
          />
         </View>
      </View>
    ); 

  }


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //justifyContent: "center",
    
    backgroundColor: "#5653D4"
  },
  text: {
    color: "#ffff",
    fontSize: 20
  },
  lowerContainer:{flex:1,backgroundColor:'white'},
  upperContainer: 
  { flexDirection:'row', width:'auto', height:50, borderWidth:1.5, alignItems:"center", backgroundColor: "grey" },
  textinputbox: 
  { width: 300, height: 40, padding: 10, borderColor: "black", borderWidth: 3, fontSize: 18, backgroundColor:"white" },
  searchButton: 
  { width: 100, height: 40, marginLeft:10, backgroundColor: "#F48D20", justifyContent: "center", alignItems: "center", borderWidth:3, borderColor:"black", borderRadius:7 },
});
