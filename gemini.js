//----------query Gemini----------//
//----AI generated mixed version for gemini.js and sketch.js from prev ex ----//

let API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

 // Helper: encode p5.Image to base64 JPEG
 //AI generated version of prev example of Gemini's sketch.js img encoder
 function encodeImg(img) {
   img.loadPixels();
   return img.canvas.toDataURL("image/jpeg").replace("data:image/jpeg;base64,", "");
 }
 
 // Call Gemini model
 async function generateVisionContent(base64Img, prompt = "Describe this image in one sentence.", model = "gemini-1.5-pro") {
   const REQUEST_URL = `${API_URL}/${model}:generateContent?key=${GOOGLE_API_KEY}`;
 
   const res = await fetch(REQUEST_URL, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       contents: [
         {
           parts: [
             { inlineData: { mimeType: "image/jpeg", data: base64Img } },
             { text: prompt }
           ]
         }
       ]
     })
   });
 
   const json = await res.json();
 
   if (json && json.candidates && json.candidates[0]) {
     return json.candidates[0].content.parts[0].text;
   } else {
     console.error("Invalid API response:", json);
     return "Description unavailable.";
   }
 }
 