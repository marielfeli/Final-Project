import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, shadow } from './theme';

export function Button({title,onPress,variant='primary',loading=false,disabled=false,icon}:{title:string;onPress:()=>void;variant?:'primary'|'outline'|'ghost'|'danger';loading?:boolean;disabled?:boolean;icon?:keyof typeof Ionicons.glyphMap}) {
 return <Pressable onPress={onPress} disabled={disabled||loading} style={({pressed})=>[s.button,variant==='outline'&&s.outline,variant==='ghost'&&s.ghost,variant==='danger'&&s.danger,(pressed)&&{opacity:.82},(disabled||loading)&&{opacity:.55}]}>
  {loading?<ActivityIndicator color={variant==='outline'||variant==='ghost'?C.blue:C.white}/>:icon?<Ionicons name={icon} size={18} color={variant==='outline'||variant==='ghost'?C.blue:C.white}/>:null}
  <Text style={[s.buttonText,(variant==='outline'||variant==='ghost')&&{color:C.blue}]}>{title}</Text>
 </Pressable>
}

export function Field({label,value,onChangeText,placeholder,secureTextEntry,multiline,keyboardType,icon}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder?:string;secureTextEntry?:boolean;multiline?:boolean;keyboardType?:any;icon?:keyof typeof Ionicons.glyphMap}) {
 const [showPassword,setShowPassword]=React.useState(false);
 return (
  <View style={{gap:7,marginBottom:14}}>
   <Text style={s.label}>{label}</Text>
   <View style={[s.fieldWrap,multiline&&{height:104,alignItems:'flex-start'}]}>
    {icon?<Ionicons name={icon} size={18} color={C.muted}/>:null}
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder||label} placeholderTextColor="#A0AAB8" secureTextEntry={secureTextEntry&&!showPassword} multiline={multiline} keyboardType={keyboardType} style={[s.input,multiline&&{textAlignVertical:'top'}]}/>
    {secureTextEntry?<Pressable onPress={()=>setShowPassword(prev=>!prev)} hitSlop={10}><Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={21} color={C.muted}/></Pressable>:null}
   </View>
  </View>
 );
}

export function Header({title,subtitle,right}:{title:string;subtitle?:string;right?:React.ReactNode}) {
 return <View style={s.header}><View style={{flex:1}}><Text style={s.h1}>{title}</Text>{subtitle?<Text style={s.sub}>{subtitle}</Text>:null}</View>{right}</View>
}

export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle}) { return <View style={[s.card,style]}>{children}</View> }

export function Pill({text,tone='blue'}:{text:string;tone?:'blue'|'green'|'amber'|'red'|'gray'}) {
 const colors:any={blue:[C.paleBlue,C.blue],green:['#E7F7F0',C.green],amber:['#FFF4DF',C.amber],red:['#FDECEE',C.red],gray:['#EEF1F5',C.muted]};
 return <View style={{backgroundColor:colors[tone][0],paddingHorizontal:10,paddingVertical:6,borderRadius:30,alignSelf:'flex-start'}}><Text style={{color:colors[tone][1],fontSize:11,fontWeight:'800',textTransform:'capitalize'}}>{text}</Text></View>
}

export function PropertyCard({item,onPress,onFavorite,favorite=false}:{item:any;onPress:()=>void;onFavorite?:()=>void;favorite?:boolean}) {
 const image=item.image||item.photos?.[0]||'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900';
 return <Pressable onPress={onPress} style={({pressed})=>[s.propertyCard,pressed&&{opacity:.9}]}>
  <View><Image source={{uri:image}} style={s.propertyImage}/>{onFavorite?<Pressable onPress={onFavorite} style={s.heart}><Ionicons name={favorite?'heart':'heart-outline'} size={20} color={favorite?C.red:C.navy}/></Pressable>:null}</View>
  <View style={{padding:14,gap:7}}><Text style={s.propertyName} numberOfLines={1}>{item.name}</Text><View style={{flexDirection:'row',alignItems:'center',gap:5}}><Ionicons name="location-outline" size={14} color={C.muted}/><Text style={s.sub} numberOfLines={1}>{item.location}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={s.price}>₱{Number(item.price||0).toLocaleString()}<Text style={s.per}> / month</Text></Text><Pill text={item.type||'Apartment'}/></View></View>
 </Pressable>
}

const s=StyleSheet.create({
 button:{backgroundColor:C.blue,minHeight:49,borderRadius:15,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},
 outline:{backgroundColor:C.white,borderWidth:1,borderColor:'#C9D9F6'},ghost:{backgroundColor:C.paleBlue},danger:{backgroundColor:C.red},
 buttonText:{color:C.white,fontWeight:'800',fontSize:14},
 label:{fontSize:12,color:C.ink,fontWeight:'800'},fieldWrap:{height:52,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.white,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},
 input:{flex:1,color:C.ink,fontSize:14,paddingVertical:10},
 header:{flexDirection:'row',alignItems:'center',marginBottom:18,gap:12},h1:{fontSize:25,fontWeight:'900',color:C.navy,letterSpacing:-.5},sub:{fontSize:12,color:C.muted,lineHeight:18},card:{backgroundColor:C.white,borderRadius:20,padding:16,...shadow},
 propertyCard:{backgroundColor:C.white,borderRadius:20,overflow:'hidden',marginBottom:15,...shadow},propertyImage:{width:'100%',height:172,backgroundColor:'#E8EDF4'},heart:{position:'absolute',right:12,top:12,width:38,height:38,borderRadius:20,backgroundColor:'white',alignItems:'center',justifyContent:'center'},propertyName:{fontSize:16,fontWeight:'900',color:C.navy},price:{fontSize:17,fontWeight:'900',color:C.blue},per:{fontSize:11,fontWeight:'500',color:C.muted}
});