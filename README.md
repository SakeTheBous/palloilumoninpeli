# palloilumoninpeli  
  
## Tarvittavat kirjastot:  
* NodeJS  
* Socket.IO  
* Express.js  
* Matter.js  
  
## Käyttö:  
    
**NodeJS asentaminen:** https://nodejs.org/en/download/package-manager/  
  
**Kirjastojen asentaminen:**  
```
npm install express  
npm install socket.io  
npm install matter-js
```  
  
**Serverin käynnistäminen:**
```
node server_node.js
```  
Tämän jälkeen serveri on käynnissä ja peliin pääsee osoitteesta localhost:3320  
  
**Pelistä:**  
  
Vihreä pallo kuvaa oman lyöntipallon sijaintia omalla ruudulla,  
punainen pallo kuvaa oman lyöntipallon oikeaa sijaintia serverillä.  
Mitä lähempänä punainen pallo on vihreää, sitä pienempi ping.
