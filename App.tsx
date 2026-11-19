
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Button, Card, Field, Header, Pill, PropertyCard } from './src/components';
import { api, clearSession, loadSession, saveSession } from './src/api';
import { Booking, Inquiry, Property, Role, User } from './src/types';
import { C, shadow } from './src/theme';

type Screen='welcome'|'login'|'register'|'home'|'details'|'favorites'|'inquiries'|'bookings'|'addProperty'|'myProperties'|'requests'|'adminUsers'|'adminListings'|'adminOwners';
const HERO='https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400';
const fallback='https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900';

export default function App() {
 const [screen,setScreen]=useState<Screen>('welcome');
 const [user,setUser]=useState<User|null>(null);
 const [tokenReady,setTokenReady]=useState(false);
 const [properties,setProperties]=useState<Property[]>([]);
 const [ownProperties,setOwnProperties]=useState<Property[]>([]);
 const [favorites,setFavorites]=useState<string[]>([]);
 const [selected,setSelected]=useState<Property|null>(null);
 const [search,setSearch]=useState('');
 const [busy,setBusy]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const [loginEmail,setLoginEmail]=useState(''); const [loginPassword,setLoginPassword]=useState('');
 const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [role,setRole]=useState<Role>('tenant');
 const [validIdFile,setValidIdFile]=useState<{uri:string;name:string;type:string;size?:number}|null>(null);
 const [ownershipProofFile,setOwnershipProofFile]=useState<{uri:string;name:string;type:string;size?:number}|null>(null);
 const [inquiries,setInquiries]=useState<Inquiry[]>([]);
 const [bookings,setBookings]=useState<Booking[]>([]);
 const [adminStats,setAdminStats]=useState<any>(null);
 const [adminUsers,setAdminUsers]=useState<User[]>([]);
 const [ownerApplications,setOwnerApplications]=useState<User[]>([]);
 const [adminProperties,setAdminProperties]=useState<Property[]>([]);
 const [propertyName,setPropertyName]=useState(''); const [propertyLocation,setPropertyLocation]=useState(''); const [propertyPrice,setPropertyPrice]=useState(''); const [propertyType,setPropertyType]=useState('Studio'); const [propertyImage,setPropertyImage]=useState(''); const [propertyDescription,setPropertyDescription]=useState('');
 const [message,setMessage]=useState(''); const [moveIn,setMoveIn]=useState(''); const [duration,setDuration]=useState('6'); const [occupants,setOccupants]=useState('1');

 const notify=(title:string,msg:string)=>Alert.alert(title,msg);

 const pickOwnerDocument = async (documentType: 'validId' | 'ownershipProof') => {
  try {
   const result = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
   });

   if (result.canceled || !result.assets?.length) return;

   const asset = result.assets[0];
   const fileName = asset.name || 'owner-document';
   const extension = fileName.split('.').pop()?.toLowerCase() || '';
   const inferredMimeType =
    extension === 'pdf' ? 'application/pdf' :
    extension === 'png' ? 'image/png' :
    extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';

   const mimeType = asset.mimeType || inferredMimeType;

   if (!['image/jpeg', 'image/png', 'application/pdf'].includes(mimeType)) {
    notify('Unsupported file', 'Please choose a JPG, PNG, or PDF document.');
    return;
   }

   if (asset.size && asset.size > 5 * 1024 * 1024) {
    notify('File too large', 'Each document must be 5 MB or smaller.');
    return;
   }

   const selectedFile = {
    uri: asset.uri,
    name: fileName,
    type: mimeType,
    size: asset.size,
   };

   if (documentType === 'validId') {
    setValidIdFile(selectedFile);
   } else {
    setOwnershipProofFile(selectedFile);
   }
  } catch (error: any) {
   notify('Document picker', error?.message || 'Unable to select the document.');
  }
 };

 const roleName=(r:Role)=>r==='tenant'?'Customer':r==='owner'?'Apartment Owner':'Administrator';

 const refreshProperties=async()=>{try{setRefreshing(true);const rows=await api.properties();setProperties(Array.isArray(rows)?rows:[]);}catch(e:any){notify('Connection issue',e.message);}finally{setRefreshing(false);}};
 const refreshRoleData=async(u:User)=>{
  try{
   if(u.role==='tenant'){
    const [fav,inq,book]=await Promise.all([api.favorites(),api.tenantInquiries(),api.customerBookings()]);
    setFavorites(fav.map(x=>x._id));setInquiries(inq);setBookings(book);
   } else if(u.role==='owner'){
    if (u.verificationStatus && !['approved','not_required'].includes(u.verificationStatus)) {
      setInquiries([]);setBookings([]);setOwnProperties([]);
      return;
    }
    const [inq,book,mine]=await Promise.all([api.ownerInquiries(),api.ownerBookings(),api.ownerProperties()]);
    setInquiries(inq);setBookings(book);setOwnProperties(mine);
   } else {
    const [stats,users,props,apps]=await Promise.all([api.adminDashboard(),api.adminUsers(),api.adminProperties(),api.adminOwnerApplications()]);
    setAdminStats(stats);setAdminUsers(users);setAdminProperties(props);setOwnerApplications(apps);
   }
  }catch(e:any){console.log('Role data:',e.message);}
 };
 useEffect(()=>{(async()=>{const session=await loadSession();if(session){setUser(session.user);await refreshProperties();await refreshRoleData(session.user);setScreen('home');}else{await refreshProperties();}setTokenReady(true);})();},[]);
 // Native app lifecycle event listener: refresh the property feed when the app returns to foreground.
 useEffect(()=>{
  const subscription=AppState.addEventListener('change',(state)=>{
   if(state==='active' && user) refreshProperties();
  });
  return ()=>subscription.remove();
 },[user]);
 const filtered=useMemo(()=>properties.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase())||p.location?.toLowerCase().includes(search.toLowerCase())),[properties,search]);

 const doLogin=async()=>{if(!loginEmail.trim()||!loginPassword){notify('Missing information','Enter your email and password.');return;}try{setBusy(true);const data=await api.login(loginEmail.trim(),loginPassword);await saveSession(data.token,data.user);setUser(data.user);await refreshProperties();await refreshRoleData(data.user);setScreen('home');setLoginPassword('');}catch(e:any){notify('Login failed',e.message);}finally{setBusy(false);}};
 const doRegister=async()=>{
  if(!name.trim()||!email.trim()||password.length<6){
   notify('Check your details','Complete all fields. Password must be at least 6 characters.');
   return;
  }
  if(role==='owner'&&(!validIdFile||!ownershipProofFile)){
   notify('Documents required','Apartment Owners must upload both a Valid ID and Proof of Ownership / Authorization.');
   return;
  }
  try{
   setBusy(true);
   await api.register({
    name:name.trim(),
    email:email.trim(),
    password,
    role,
    validId:validIdFile||undefined,
    ownershipProof:ownershipProofFile||undefined,
   });
   notify('Registration submitted',role==='owner'?'Your owner account and documents have been submitted for Admin verification.':'Your account has been created. You can now sign in.');
   setScreen('login');
   setName('');
   setEmail('');
   setPassword('');
   setValidIdFile(null);
   setOwnershipProofFile(null);
  }catch(e:any){
   notify('Registration failed',e.message);
  }finally{
   setBusy(false);
  }
 };
 const logout=async()=>{await clearSession();setUser(null);setFavorites([]);setScreen('welcome');};
 const openProperty=(p:Property)=>{setSelected(p);setScreen('details');};
 const toggleFavorite=async(id:string)=>{if(!user){setScreen('login');return;}try{const saved=favorites.includes(id);const result=await api.toggleFavorite(id,saved);setFavorites((result.favorites||[]).filter(Boolean).map((p:any)=>typeof p==='string'?p:p._id));}catch(e:any){notify('Favorites',e.message);}};
 const sendInquiry=async()=>{if(!selected||!message.trim())return;try{setBusy(true);await api.sendInquiry(selected._id,message.trim());setMessage('');notify('Message sent','Your inquiry has been sent to the apartment owner.');}catch(e:any){notify('Unable to send',e.message);}finally{setBusy(false);}};
 const createBooking=async()=>{if(!selected||!moveIn.trim()){notify('Booking details','Please enter a preferred move-in date (YYYY-MM-DD).');return;}try{setBusy(true);await api.createBooking({propertyId:selected._id,moveInDate:moveIn,durationMonths:Number(duration),occupants:Number(occupants),message});notify('Request submitted','Your booking request is now pending owner review.');setScreen('bookings');if(user)await refreshRoleData(user);}catch(e:any){notify('Booking failed',e.message);}finally{setBusy(false);}};
 const addProperty=async()=>{if(!propertyName.trim()||!propertyLocation.trim()||!propertyPrice||!propertyDescription.trim()){notify('Missing details','Complete the apartment information.');return;}try{setBusy(true);await api.createProperty({name:propertyName,location:propertyLocation,price:Number(propertyPrice),type:propertyType,image:propertyImage||fallback,photos:[propertyImage||fallback],description:propertyDescription,amenities:[]});notify('Submitted for review','Your apartment listing has been submitted to Admin approval.');setPropertyName('');setPropertyLocation('');setPropertyPrice('');setPropertyDescription('');setScreen('myProperties');await refreshProperties();if(user)await refreshRoleData(user);}catch(e:any){notify('Unable to submit',e.message);}finally{setBusy(false);}};
 const decideBooking=async(id:string,status:'approved'|'rejected')=>{try{await api.updateBooking(id,status,status==='rejected'?'Please contact the owner for more information.':undefined);if(user)await refreshRoleData(user);notify('Booking updated',`Booking ${status}.`);}catch(e:any){notify('Update failed',e.message);}};
 const adminPropertyDecision=async(id:string,status:string)=>{try{await api.adminDecideProperty(id,status,status==='rejected'?'Please review the apartment information and submit corrections.':undefined);if(user)await refreshRoleData(user);notify('Listing updated',`Listing ${status}.`);}catch(e:any){notify('Update failed',e.message);}};
 const adminUserStatus=async(id:string,status:string)=>{try{await api.adminDecideUser(id,status);if(user)await refreshRoleData(user);notify('Account updated',`Account ${status}.`);}catch(e:any){notify('Update failed',e.message);}};

 const go=(s:Screen)=>setScreen(s);
 const Tab=({icon,label,target,active}:{icon:any;label:string;target:Screen;active:boolean})=><Pressable onPress={()=>go(target)} style={styles.tab}><Ionicons name={icon} size={21} color={active?C.blue:'#8A97A9'}/><Text style={[styles.tabText,active&&{color:C.blue}]}>{label}</Text></Pressable>;
 const BottomTabs=()=>user?<View style={styles.bottom}>
  {user.role==='tenant'?<><Tab icon="compass-outline" label="Explore" target="home" active={screen==='home'}/><Tab icon="heart-outline" label="Saved" target="favorites" active={screen==='favorites'}/><Tab icon="calendar-outline" label="Bookings" target="bookings" active={screen==='bookings'}/><Tab icon="chatbubble-ellipses-outline" label="Messages" target="inquiries" active={screen==='inquiries'}/></>:
  user.role==='owner'?<><Tab icon="grid-outline" label="Overview" target="home" active={screen==='home'}/><Tab icon="business-outline" label="My Units" target="myProperties" active={screen==='myProperties'}/><Tab icon="calendar-outline" label="Requests" target="requests" active={screen==='requests'}/><Tab icon="chatbubble-outline" label="Inquiries" target="inquiries" active={screen==='inquiries'}/></>:
  <><Tab icon="grid-outline" label="Overview" target="home" active={screen==='home'}/><Tab icon="people-outline" label="Users" target="adminUsers" active={screen==='adminUsers'}/><Tab icon="business-outline" label="Listings" target="adminListings" active={screen==='adminListings'}/></>}
 </View>:null;

 if(!tokenReady)return <View style={styles.loading}><ActivityIndicator size="large" color={C.blue}/><Text style={styles.muted}>Preparing StayFinder...</Text></View>;

 if(screen==='welcome')return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.hero}><Image source={{uri:HERO}} style={[StyleSheet.absoluteFill,{opacity:.62}]} resizeMode="cover"/><LinearGradient colors={['rgba(13,31,54,.35)','rgba(13,31,54,.96)']} style={StyleSheet.absoluteFill}/><View style={styles.heroContent}><View style={styles.logoLarge}><Ionicons name="home" size={27} color="white"/></View><Text style={styles.heroTitle}>Find your{'\n'}next <Text style={{color:'#72D9E2'}}>home.</Text></Text><Text style={styles.heroSub}>Discover verified apartments and make your next move with confidence.</Text><View style={{gap:12,marginTop:28}}><Pressable onPress={()=>go('register')} style={styles.heroPrimary}><Text style={styles.heroPrimaryText}>Get started</Text><Ionicons name="arrow-forward" size={18} color={C.navy}/></Pressable><Pressable onPress={()=>go('login')} style={styles.heroSecondary}><Text style={styles.heroSecondaryText}>I already have an account</Text></Pressable></View><Text style={styles.heroFoot}>A BETTER WAY TO FIND WHERE YOU BELONG</Text></View></View></SafeAreaView>;

 if(screen==='login'||screen==='register')return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled"><Pressable onPress={()=>go('welcome')} style={styles.back}><Ionicons name="arrow-back" size={20} color={C.navy}/><Text style={styles.backText}>Back</Text></Pressable><View style={styles.authIcon}><Ionicons name="home" size={24} color={C.blue}/></View><Text style={styles.authTitle}>{screen==='login'?'Welcome back':'Create your account'}</Text><Text style={styles.authSub}>{screen==='login'?'Sign in to continue your StayFinder journey.':'Join StayFinder and find a place that feels like home.'}</Text>{screen==='register'?<><Field label="Full name" value={name} onChangeText={setName} icon="person-outline"/><Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline"/><Text style={styles.fieldLabel}>Account type</Text><View style={styles.roleRow}>{(['tenant','owner'] as Role[]).map(r=><Pressable key={r} onPress={()=>setRole(r)} style={[styles.roleChoice,role===r&&styles.roleSelected]}><Ionicons name={r==='owner'?'business-outline':'person-outline'} size={19} color={role===r?C.blue:C.muted}/><Text style={[styles.roleText,role===r&&{color:C.blue}]}>{r==='owner'?'Apartment Owner':'Customer'}</Text></Pressable>)}</View>{role==='owner'?<><View style={styles.notice}><Ionicons name="information-circle" size={17} color={C.amber}/><Text style={styles.noticeText}>Apartment Owner accounts require Admin verification. Upload both documents below. Accepted formats: JPG, PNG, or PDF. Maximum file size: 5 MB each.</Text></View><Text style={styles.fieldLabel}>Valid ID document</Text><Pressable onPress={()=>pickOwnerDocument('validId')} style={styles.documentPicker}><Ionicons name="cloud-upload-outline" size={21} color={C.blue}/><View style={{flex:1}}><Text style={styles.documentPickerTitle}>{validIdFile?'Change Valid ID':'Choose Valid ID'}</Text><Text style={styles.documentPickerSub}>{validIdFile?validIdFile.name:'JPG, PNG, or PDF · Up to 5 MB'}</Text></View><Ionicons name="folder-open-outline" size={19} color={C.blue}/></Pressable><Text style={[styles.fieldLabel,{marginTop:14}]}>Proof of ownership / authorization</Text><Pressable onPress={()=>pickOwnerDocument('ownershipProof')} style={styles.documentPicker}><Ionicons name="document-attach-outline" size={21} color={C.blue}/><View style={{flex:1}}><Text style={styles.documentPickerTitle}>{ownershipProofFile?'Change proof document':'Choose proof document'}</Text><Text style={styles.documentPickerSub}>{ownershipProofFile?ownershipProofFile.name:'JPG, PNG, or PDF · Up to 5 MB'}</Text></View><Ionicons name="folder-open-outline" size={19} color={C.blue}/></Pressable></>:null}<Field label="Password" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline"/></>:<><Field label="Email address" value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" icon="mail-outline"/><Field label="Password" value={loginPassword} onChangeText={setLoginPassword} secureTextEntry icon="lock-closed-outline"/></>}<Button title={screen==='login'?'Sign in':'Create account'} onPress={screen==='login'?doLogin:doRegister} loading={busy}/><Pressable onPress={()=>go(screen==='login'?'register':'login')} style={styles.switchAuth}><Text style={styles.switchText}>{screen==='login'?"Don't have an account? ":"Already have an account? "}<Text style={{color:C.blue,fontWeight:'900'}}>{screen==='login'?'Sign up':'Sign in'}</Text></Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;

 return <SafeAreaView style={styles.safe}>
  <StatusBar style="dark"/>
  <View style={styles.topbar}>
   <Pressable onPress={()=>user?go('home'):go('welcome')}><View style={styles.brandMark}><Ionicons name="home" size={18} color="white"/></View></Pressable>
   <View style={{flex:1}}><Text style={styles.brand}>stayfinder</Text><Text style={styles.brandTag}>FIND A PLACE TO CALL HOME</Text></View>
   {user ? (
    <Pressable
     onPress={() =>
      Alert.alert('Log out', 'Are you sure you want to log out?', [
       { text: 'Cancel', style: 'cancel' },
       { text: 'Log out', style: 'destructive', onPress: () => { void logout(); } },
      ])
     }
     style={styles.avatar}
     accessibilityRole="button"
     accessibilityLabel="Log out"
    >
     <Ionicons name="log-out-outline" size={21} color={C.blue} />
    </Pressable>
   ) : null}
  </View>
  <KeyboardAvoidingView
   style={{flex:1}}
   behavior={Platform.OS==='ios'?'padding':'height'}
   keyboardVerticalOffset={0}
  >
  <ScrollView
   style={{flex:1}}
   contentContainerStyle={[styles.page,{paddingBottom:45}]}
   keyboardShouldPersistTaps="handled"
   keyboardDismissMode="on-drag"
  >
 {screen==='home'&&user?.role==='tenant'?<><View style={styles.greeting}><View><Text style={styles.eyebrow}>DISCOVER YOUR NEXT PLACE</Text><Text style={styles.greetTitle}>Hello, {user.name.split(' ')[0]} 👋</Text><Text style={styles.muted}>Find a space that fits your lifestyle.</Text></View><View style={styles.greetAvatar}><Ionicons name="person" size={20} color={C.blue}/></View></View><View style={styles.searchBox}><Ionicons name="search" size={19} color={C.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Search location or apartment..." placeholderTextColor="#98A4B4" style={{flex:1,color:C.ink}}/><Ionicons name="options-outline" size={19} color={C.blue}/></View><View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>Explore apartments</Text><Text style={styles.muted}>{filtered.length} places to discover</Text></View><Pressable onPress={refreshProperties}><Ionicons name="refresh" size={19} color={C.blue}/></Pressable></View>{filtered.filter(p=>!p.status||p.status==='approved'||p.approvalStatus==='approved').map(p=><PropertyCard key={p._id} item={p} onPress={()=>openProperty(p)} favorite={favorites.includes(p._id)} onFavorite={()=>toggleFavorite(p._id)}/>)}</>:null}
 {screen==='home'&&user?.role==='owner'?<><Header title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Your rental business at a glance." right={<Pill text={user.verificationStatus||'Owner account'} tone={user.verificationStatus==='approved'?'green':'amber'}/>}/>{user.verificationStatus&&user.verificationStatus!=='approved'?<View style={styles.notice}><Ionicons name="time-outline" size={17} color={C.amber}/><Text style={styles.noticeText}>Your Apartment Owner application is {user.verificationStatus}. Admin approval is required before you can manage listings.</Text></View>:null}<LinearGradient colors={['#173C68','#2368B5']} style={styles.ownerBanner}><Text style={styles.bannerSmall}>OWNER WORKSPACE</Text><Text style={styles.bannerTitle}>Manage your apartments{'\n'}with confidence.</Text><Text style={styles.bannerSub}>Keep your listings fresh and respond to customers.</Text></LinearGradient><View style={styles.statGrid}><Stat label="My apartments" value={String(ownProperties.length)} icon="business-outline"/><Stat label="Booking requests" value={String(bookings.filter(b=>b.status==='pending').length)} icon="calendar-outline"/><Stat label="Confirmed" value={String(bookings.filter(b=>b.status==='approved').length)} icon="checkmark-circle-outline"/><Stat label="Inquiries" value={String(inquiries.length)} icon="chatbubble-outline"/></View>{(!user.verificationStatus||user.verificationStatus==='approved'||user.verificationStatus==='not_required')?<><Button title="Add new apartment" icon="add" onPress={()=>go('addProperty')}/><View style={{height:18}}/><Button title="Manage my apartments" variant="outline" icon="business-outline" onPress={()=>go('myProperties')}/></>:null}</>:null}
 {screen==='home'&&user?.role==='admin'?<><Header title="Admin overview" subtitle="Monitor your StayFinder platform." right={<Pill text="Administrator" tone="blue"/>}/><LinearGradient colors={['#172D49','#255B91']} style={styles.ownerBanner}><Text style={styles.bannerSmall}>STAYFINDER CONTROL CENTER</Text><Text style={styles.bannerTitle}>Everything in{'\n'}one overview.</Text><Text style={styles.bannerSub}>Review users, owner applications and apartment listings.</Text></LinearGradient><View style={styles.statGrid}><Stat label="Total users" value={String(adminStats?.totalUsers??0)} icon="people-outline"/><Stat label="Apartment owners" value={String(adminStats?.totalOwners??0)} icon="business-outline"/><Stat label="Customers" value={String(adminStats?.totalTenants??0)} icon="person-outline"/><Stat label="Apartments" value={String(adminStats?.totalProperties??0)} icon="home-outline"/></View><Button title={`Review owner applications (${adminStats?.pendingOwnerApplications??0})`} icon="shield-checkmark-outline" onPress={()=>go('adminOwners')}/><View style={{height:12}}/><Button title="Review users" variant="outline" icon="people-outline" onPress={()=>go('adminUsers')}/><View style={{height:12}}/><Button title="Review apartment listings" variant="outline" icon="clipboard-outline" onPress={()=>go('adminListings')}/></>:null}
 {screen==='details'&&selected?<><Pressable onPress={()=>go('home')} style={styles.inlineBack}><Ionicons name="arrow-back" size={18} color={C.navy}/><Text style={styles.backText}>Back to explore</Text></Pressable><Image source={{uri:selected.image||selected.photos?.[0]||fallback}} style={styles.detailImage}/><View style={styles.detailTitleRow}><View style={{flex:1}}><Text style={styles.detailTitle}>{selected.name}</Text><Text style={styles.muted}><Ionicons name="location-outline"/> {selected.location}</Text></View><Pressable onPress={()=>toggleFavorite(selected._id)} style={styles.detailHeart}><Ionicons name={favorites.includes(selected._id)?'heart':'heart-outline'} size={22} color={C.red}/></Pressable></View><Text style={styles.detailPrice}>₱{Number(selected.price).toLocaleString()} <Text style={styles.per}>/ month</Text></Text><Text style={styles.sectionTitle}>About this apartment</Text><Text style={styles.bodyText}>{selected.description}</Text><View style={styles.detailMeta}><Pill text={selected.type||'Apartment'}/><Pill text={selected.availability||'Availability to confirm'} tone="green"/></View><Text style={styles.sectionTitle}>Contact the owner</Text><Field label="Your message" value={message} onChangeText={setMessage} multiline placeholder="Ask about availability, viewing schedule, or details..."/><Button title="Send inquiry" icon="chatbubble-outline" onPress={sendInquiry} loading={busy}/><View style={{height:14}}/><Text style={styles.sectionTitle}>Request a booking</Text><Field label="Preferred move-in date (YYYY-MM-DD)" value={moveIn} onChangeText={setMoveIn} placeholder="2026-12-01"/><View style={styles.twoFields}><View style={{flex:1}}><Field label="Duration (months)" value={duration} onChangeText={setDuration} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Occupants" value={occupants} onChangeText={setOccupants} keyboardType="number-pad"/></View></View><Button title="Submit booking request" icon="calendar" onPress={createBooking} loading={busy}/></>:null}
 {screen==='favorites'?<><Header title="Saved apartments" subtitle="Your shortlist of places to call home."/><Text style={styles.muted}>{favorites.length} saved properties</Text>{properties.filter(p=>favorites.includes(p._id)).map(p=><PropertyCard key={p._id} item={p} onPress={()=>openProperty(p)} favorite onFavorite={()=>toggleFavorite(p._id)}/>)}</>:null}
 {screen==='bookings'?<><Header title="My bookings" subtitle="Track your rental requests and confirmations."/>{bookings.length?bookings.map(b=><Card key={b._id} style={{marginBottom:12,gap:9}}><Text style={styles.cardTitle}>{b.propertyName||'Apartment booking'}</Text><Text style={styles.muted}>Move-in: {new Date(b.moveInDate).toLocaleDateString()}</Text><Text style={styles.muted}>{b.durationMonths} months · {b.occupants} occupant(s)</Text><Pill text={b.status} tone={b.status==='approved'?'green':b.status==='rejected'?'red':'amber'}/>{b.rejectionReason?<Text style={styles.bodyText}>Reason: {b.rejectionReason}</Text>:null}</Card>):<Empty title="No bookings yet" text="Your booking requests will appear here."/>}</>:null}
 {screen==='inquiries'?<><Header title="Messages & inquiries" subtitle="Conversations about apartments."/>{inquiries.length?inquiries.map(i=><Card key={i._id} style={{marginBottom:12,gap:8}}><Text style={styles.cardTitle}>{i.propertyName}</Text><Text style={styles.muted}>{user?.role==='owner'?`From ${i.tenantName}`:`To ${i.ownerName}`}</Text><Text style={styles.bodyText}>{i.message}</Text><Pill text={i.status} tone={i.status==='Read'?'green':'amber'}/>{user?.role==='owner'&&i.status!=='Read'?<Button title="Mark as read" variant="outline" onPress={async()=>{await api.markInquiryRead(i._id);if(user)await refreshRoleData(user);}}/>:null}</Card>):<Empty title="No messages yet" text="Your apartment conversations will appear here."/ >}</>:null}
 {screen==='addProperty'?<><Header title="Add apartment" subtitle="Submit your apartment for Admin review."/><Field label="Apartment name" value={propertyName} onChangeText={setPropertyName} placeholder="e.g. Sunrise Residences"/><Field label="Complete location" value={propertyLocation} onChangeText={setPropertyLocation} placeholder="Street, Barangay, City"/><Field label="Monthly rental price (₱)" value={propertyPrice} onChangeText={setPropertyPrice} keyboardType="number-pad"/><Text style={styles.fieldLabel}>Property type</Text><View style={styles.roleRow}>{['Studio','Apartment','Condominium','Boarding House'].map(t=><Pressable key={t} onPress={()=>setPropertyType(t)} style={[styles.chip,propertyType===t&&styles.chipActive]}><Text style={[styles.chipText,propertyType===t&&{color:C.blue}]}>{t}</Text></Pressable>)}</View><Field label="Cover image URL" value={propertyImage} onChangeText={setPropertyImage} placeholder="https://..."/><Field label="Description" value={propertyDescription} onChangeText={setPropertyDescription} multiline placeholder="Describe the apartment, facilities and house rules..."/><Button title="Submit for Admin approval" icon="send" onPress={addProperty} loading={busy}/></>:null}
 {screen==='myProperties'?<><Header title="My apartments" subtitle="Manage your rental listings." right={<Pressable onPress={()=>go('addProperty')} style={styles.addCircle}><Ionicons name="add" size={22} color="white"/></Pressable>}/>{ownProperties.map(p=><PropertyCard key={p._id} item={p} onPress={()=>openProperty(p)}/>)}</>:null}
 {screen==='requests'?<><Header title="Booking requests" subtitle="Review customer reservation requests."/>{bookings.length?bookings.map(b=><Card key={b._id} style={{marginBottom:12,gap:9}}><Text style={styles.cardTitle}>{b.propertyName||'Apartment booking'}</Text><Text style={styles.muted}>{b.customerName||b.customerEmail}</Text><Text style={styles.bodyText}>Move-in: {new Date(b.moveInDate).toLocaleDateString()} · {b.durationMonths} months · {b.occupants} occupant(s)</Text><Pill text={b.status} tone={b.status==='approved'?'green':b.status==='rejected'?'red':'amber'}/>{b.status==='pending'?<View style={styles.twoFields}><View style={{flex:1}}><Button title="Approve" onPress={()=>decideBooking(b._id,'approved')}/></View><View style={{flex:1}}><Button title="Reject" variant="danger" onPress={()=>decideBooking(b._id,'rejected')}/></View></View>:null}</Card>):<Empty title="No booking requests" text="New customer requests will appear here."/ >}</>:null}
 {screen==='adminOwners'?<><Header title="Owner verification" subtitle="Review Apartment Owner applications."/>{ownerApplications.length?ownerApplications.map(u=>{const documents=(u as any);const hasValidId=!!documents.validIdDocument;const hasOwnershipProof=!!documents.ownershipProofDocument;const hasBothDocuments=hasValidId&&hasOwnershipProof;return <Card key={u.id||u._id} style={{marginBottom:12,gap:9}}><Text style={styles.cardTitle}>{u.name}</Text><Text style={styles.muted}>{u.email}</Text><Pill text={u.verificationStatus||'pending'} tone={u.verificationStatus==='approved'?'green':'amber'}/><Text style={styles.bodyText}>Check that both required documents have been submitted. Documents are stored privately and are intended for Admin review only.</Text><View style={styles.documentStatus}><Ionicons name={hasValidId?'checkmark-circle':'alert-circle'} size={18} color={hasValidId?C.green:C.amber}/><Text style={styles.documentStatusText}>Valid ID: {hasValidId?documents.validIdDocument.originalName||'Uploaded':'Not uploaded'}</Text></View><View style={styles.documentStatus}><Ionicons name={hasOwnershipProof?'checkmark-circle':'alert-circle'} size={18} color={hasOwnershipProof?C.green:C.amber}/><Text style={styles.documentStatusText}>Proof of ownership: {hasOwnershipProof?documents.ownershipProofDocument.originalName||'Uploaded':'Not uploaded'}</Text></View><View style={styles.twoFields}>{hasBothDocuments?<View style={{flex:1}}><Button title="Approve" onPress={async()=>{try{await api.adminVerifyOwner(u.id||u._id||'','approved');if(user)await refreshRoleData(user);notify('Owner approved','Owner account has been approved.');}catch(e:any){notify('Verification failed',e.message);}}}/></View>:<View style={{flex:1,justifyContent:'center'}}><Text style={styles.noticeText}>Both required documents must be uploaded before approval.</Text></View>}<View style={{flex:1}}><Button title="Request revision" variant="outline" onPress={async()=>{try{await api.adminVerifyOwner(u.id||u._id||'','revision','Please submit valid ID and proof of ownership.');if(user)await refreshRoleData(user);notify('Revision requested','Applicant must update their documents.');}catch(e:any){notify('Verification failed',e.message);}}}/></View></View></Card>; }):<Empty title="No pending applications" text="New Apartment Owner applications will appear here."/ >}</>:null}
 {screen==='adminUsers'?<><Header title="User management" subtitle="Monitor customer and owner accounts."/>{adminUsers.map(u=><Card key={u.id||u._id} style={{marginBottom:10,gap:8}}><View style={styles.userLine}><View style={styles.userAvatar}><Text style={{fontWeight:'900',color:C.blue}}>{u.name?.slice(0,1)}</Text></View><View style={{flex:1}}><Text style={styles.cardTitle}>{u.name}</Text><Text style={styles.muted}>{u.email}</Text></View><Pill text={u.role==='tenant'?'Customer':u.role}/></View><View style={styles.twoFields}><View style={{flex:1}}><Button title="Activate" variant="outline" onPress={()=>adminUserStatus(u.id||u._id||'','active')}/></View><View style={{flex:1}}><Button title="Deactivate" variant="danger" onPress={()=>adminUserStatus(u.id||u._id||'','deactivated')}/></View></View></Card>)}</>:null}
 {screen==='adminListings'?<><Header title="Listing review" subtitle="Review apartments submitted by owners."/>{adminProperties.map(p=><Card key={p._id} style={{marginBottom:12,gap:9}}><Image source={{uri:p.image||fallback}} style={styles.adminImage}/><Text style={styles.cardTitle}>{p.name}</Text><Text style={styles.muted}>{p.location} · ₱{Number(p.price).toLocaleString()}/month</Text><Pill text={p.status||p.approvalStatus||'approved'} tone={p.status==='rejected'?'red':p.status==='pending'?'amber':'green'}/>{(p.status==='pending'||p.approvalStatus==='pending')?<View style={styles.twoFields}><View style={{flex:1}}><Button title="Approve" onPress={()=>adminPropertyDecision(p._id,'approved')}/></View><View style={{flex:1}}><Button title="Reject" variant="danger" onPress={()=>adminPropertyDecision(p._id,'rejected')}/></View></View>:null}</Card>)}</>:null}
 </ScrollView>
  </KeyboardAvoidingView>
  <BottomTabs/>
 </SafeAreaView>;
}

function Stat({label,value,icon}:{label:string;value:string;icon:any}){return <Card style={{width:'48%',gap:7}}><View style={styles.statIcon}><Ionicons name={icon} size={18} color={C.blue}/></View><Text style={styles.statValue}>{value}</Text><Text style={styles.muted}>{label}</Text></Card>}
function Empty({title,text}:{title:string;text:string}){return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="file-tray-outline" size={28} color={C.blue}/></View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.muted}>{text}</Text></View>}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',gap:12},muted:{fontSize:12,color:C.muted,lineHeight:18},
 topbar:{height:68,backgroundColor:C.white,flexDirection:'row',alignItems:'center',paddingHorizontal:20,gap:11,borderBottomWidth:1,borderColor:C.line},brandMark:{width:36,height:36,borderRadius:12,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},brand:{fontSize:18,fontWeight:'900',color:C.navy,letterSpacing:-.5},brandTag:{fontSize:8,fontWeight:'800',letterSpacing:1.4,color:C.muted},avatar:{width:36,height:36,borderRadius:18,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center'},
 hero:{flex:1,backgroundColor:C.navy,justifyContent:'flex-end'},heroContent:{paddingHorizontal:28,paddingBottom:54},logoLarge:{width:58,height:58,borderRadius:19,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginBottom:27},heroTitle:{fontSize:48,lineHeight:52,fontWeight:'900',color:'white',letterSpacing:-1.7},heroSub:{fontSize:15,color:'#D5DFEA',lineHeight:24,marginTop:15,maxWidth:310},heroPrimary:{height:57,borderRadius:17,backgroundColor:'#8CE3E8',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,flexDirection:'row'},heroPrimaryText:{fontSize:15,fontWeight:'900',color:C.navy},heroSecondary:{height:53,borderRadius:17,borderWidth:1,borderColor:'rgba(255,255,255,.38)',alignItems:'center',justifyContent:'center'},heroSecondaryText:{color:'white',fontSize:13,fontWeight:'800'},heroFoot:{color:'#9FB0C2',fontSize:9,fontWeight:'800',letterSpacing:1.5,marginTop:34},
 authPage:{padding:24,paddingTop:18,flexGrow:1},back:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:32},backText:{fontSize:13,fontWeight:'800',color:C.navy},authIcon:{width:52,height:52,borderRadius:17,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center',marginBottom:18},authTitle:{fontSize:29,fontWeight:'900',color:C.navy,letterSpacing:-.8},authSub:{fontSize:13,color:C.muted,lineHeight:20,marginTop:7,marginBottom:26},fieldLabel:{fontSize:12,fontWeight:'800',color:C.ink,marginBottom:8},roleRow:{flexDirection:'row',flexWrap:'wrap',gap:9,marginBottom:15},roleChoice:{flex:1,minWidth:135,borderWidth:1,borderColor:C.line,backgroundColor:C.white,borderRadius:14,padding:13,flexDirection:'row',alignItems:'center',gap:8},roleSelected:{borderColor:C.blue,backgroundColor:C.paleBlue},roleText:{fontSize:12,fontWeight:'800',color:C.muted},notice:{backgroundColor:'#FFF7E8',borderRadius:12,padding:11,flexDirection:'row',gap:8,marginBottom:15},noticeText:{flex:1,fontSize:11,color:'#91641E',lineHeight:17},documentPicker:{minHeight:62,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:14,paddingHorizontal:13,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:11,marginBottom:8},documentPickerTitle:{fontSize:12,fontWeight:'900',color:C.navy},documentPickerSub:{fontSize:10,color:C.muted,marginTop:4},documentStatus:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.bg,borderRadius:10,padding:10},documentStatusText:{flex:1,fontSize:11,color:C.ink,fontWeight:'700'},switchAuth:{alignItems:'center',paddingVertical:20},switchText:{fontSize:12,color:C.muted,fontWeight:'600'},
 page:{padding:18,paddingBottom:35},greeting:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.4,color:C.blue},greetTitle:{fontSize:25,fontWeight:'900',color:C.navy,marginTop:5},greetAvatar:{width:43,height:43,borderRadius:16,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center'},searchBox:{height:53,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10,marginBottom:23},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14},sectionTitle:{fontSize:17,fontWeight:'900',color:C.navy,marginBottom:4},ownerBanner:{borderRadius:22,padding:20,marginBottom:15},bannerSmall:{fontSize:9,fontWeight:'900',letterSpacing:1.6,color:'#B9D9F5'},bannerTitle:{fontSize:25,fontWeight:'900',lineHeight:30,color:'white',marginTop:10},bannerSub:{fontSize:12,color:'#D2E0EF',lineHeight:18,marginTop:8},statGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginBottom:18},statIcon:{width:34,height:34,borderRadius:11,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center'},statValue:{fontSize:24,fontWeight:'900',color:C.navy},bottom:{height:70,backgroundColor:C.white,borderTopWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:5},tab:{alignItems:'center',justifyContent:'center',gap:4,flex:1},tabText:{fontSize:9,fontWeight:'800',color:'#8A97A9'},inlineBack:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},detailImage:{height:220,width:'100%',borderRadius:20,backgroundColor:C.line},detailTitleRow:{flexDirection:'row',alignItems:'center',marginTop:17,marginBottom:7},detailTitle:{fontSize:22,fontWeight:'900',color:C.navy,marginBottom:5},detailHeart:{width:43,height:43,borderRadius:15,backgroundColor:C.white,alignItems:'center',justifyContent:'center',...shadow},detailPrice:{fontSize:23,fontWeight:'900',color:C.blue,marginBottom:18},per:{fontSize:12,fontWeight:'500',color:C.muted},bodyText:{fontSize:13,color:'#58677A',lineHeight:21,marginBottom:14},detailMeta:{flexDirection:'row',gap:8,marginBottom:18,marginTop:5},twoFields:{flexDirection:'row',gap:10},cardTitle:{fontSize:15,fontWeight:'900',color:C.navy},empty:{alignItems:'center',paddingVertical:55,gap:8},emptyIcon:{width:58,height:58,borderRadius:20,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center',marginBottom:5},addCircle:{width:39,height:39,borderRadius:14,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},chip:{paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:C.white,borderWidth:1,borderColor:C.line},chipActive:{backgroundColor:C.paleBlue,borderColor:C.blue},chipText:{fontSize:11,color:C.muted,fontWeight:'800'},userLine:{flexDirection:'row',alignItems:'center',gap:10},userAvatar:{width:38,height:38,borderRadius:14,backgroundColor:C.paleBlue,alignItems:'center',justifyContent:'center'},adminImage:{width:'100%',height:130,borderRadius:13,backgroundColor:C.line}
});
