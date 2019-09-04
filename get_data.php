<?php
$host='localhost';
$dbname='addok2016';
$user='root';
$password='';

$db=null;
try{
	$db=new PDO("mysql:host=$host;dbname=$dbname", $user, $password);
}catch(PDOException $e){
	echo $e->getMessage();
	die("Error!");
}
//connected. good now onto the query
if($_GET['nip_pfpd'] && $_GET['tgl_tt']){
	//good. we get fresh data
	$nip_pfpd=$_GET['nip_pfpd'];
	$tgl=substr($_GET['tgl_tt'], 0, 2);
	$bln=substr($_GET['tgl_tt'], 3, 2);
	$thn=substr($_GET['tgl_tt'], 6, 4);
	$tanggal=$thn.'-'.$bln.'-'.$tgl;
	$qsel="SELECT no_pib, CONCAT(RIGHT(tgl_pib,2), MID(tgl_pib, 6,2), LEFT(tgl_pib, 4)-2000) AS tglpib, importir FROM data_pokok WHERE tgl_tt=:tanggal AND nip_pfpd = :nip_pfpd AND jalur='HIJAU'";
	
	$stmt=$db->prepare($qsel);
	$stmt->execute(array('tanggal'=>$tanggal, 'nip_pfpd'=>$nip_pfpd));
	
	$result=$stmt->fetchAll(PDO::FETCH_ASSOC);
	echo JSON_encode($result);
}
?>