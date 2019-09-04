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

$stmt=$db->prepare("SELECT DISTINCT data_pokok.nip_pfpd, pfpd.nm_pfpd FROM data_pokok LEFT JOIN pfpd ON data_pokok.nip_pfpd=pfpd.nip_pfpd ORDER BY pfpd.nm_pfpd");
$stmt->execute();

$result=$stmt->fetchAll(PDO::FETCH_ASSOC);

echo JSON_encode($result);

?>