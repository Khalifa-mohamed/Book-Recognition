import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import { Fileinput } from "./Fileinput";

function App() {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const API_TOKEN = "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";
  const GOOGLE_BOOKS_API_KEY = "AIzaSyA9J0JzKuu_IbOEaJBlAilIFIwygr3bjOE";

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  // Convert image to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });
  };

  // Query Hugging Face API to get caption from image
  const query = async (base64Image) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: base64Image }),
        }
      );
      const result = await response.json();
      return result;
    } catch (err) {
      setError("Error querying Hugging Face API.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search books using the generated caption from Hugging Face
  const searchBooks = async (query) => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}`
      );
      setBook(response.data.items ? response.data.items[0] : null);
    } catch (err) {
      setError("Error fetching books.");
      console.error("Error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Clean the caption to remove unwanted words like "book cover" and anything after "by"
  const cleanCaption = (text) => {
    const cleanedText = text
      .replace(/\b(a book cover of|cover image)\b/gi, "")
      .replace(/\bby\b.*$/gi, "") 
      .trim(); 
    return cleanedText;
  };

  // Handle form submission (get caption and search books)
  const handleSubmit = async () => {
    if (!image) return;

    const file = document.querySelector('input[type="file"]').files[0];
    const base64Image = await convertImageToBase64(file);
    const result = await query(base64Image);

    if (result && result[0]) {
      let generatedCaption = result[0].generated_text;
      generatedCaption = cleanCaption(generatedCaption);
      setCaption(generatedCaption);
      searchBooks(generatedCaption);
    }
  };

  return (
    <>
      <div>
        <div className="bg-[#1c213e] w-full p-6 rounded-b-3xl shadow-2xl ">
          <h1 className="head text-xl text-white font-serif font-semibold">
            Book{" "}
            <span className="font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Recognition
            </span>
          </h1>
        </div>
        <div>
          <div className="m-12 bg-white p-6 border border-gray-300 rounded-lg">
            <h1 className="text-lg font-medium">Find Your Book</h1>
            <div className="flex gap-10">
              <Fileinput handleImageUpload={handleImageUpload} />
              {image && (
                <div>
                  <img
                    src={image}
                    alt="Uploaded"
                    className="h-64 w-[250px] rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-10 items-center my-4">
              <button
                onClick={handleSubmit}
                disabled={loading || searchLoading}
                className="px-8 py-2 rounded-full bg-gradient-to-t from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white hover:font-semibold duration-300 hover:scale-105"
              >
                {loading || searchLoading ? "Processing..." : "Find Book"}
              </button>

              {caption && (
                <div className="flex gap-3 items-center">
                  <h3 className="font-semibold">Book Title:</h3>
                  <p className="text-sm uppercase">{caption}</p>
                </div>
              )}
            </div>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="m-12 p-6 rounded-lg relative">
            {book && (
              <>
                <div className="flex gap-20">
                  <div>
                    {book.volumeInfo.imageLinks?.thumbnail ? (
                      <img
                        src={book.volumeInfo.imageLinks.thumbnail}
                        alt={book.volumeInfo.title}
                        className="w-[380px] h-[340px] border border-black rounded-lg shadow-2xl relative z-30"
                      />
                    ) : (
                      <div>No Image Available</div>
                    )}
                  </div>
                  <div className="w-full">
                    <div className="text-white border-2 border-[#1c213e] p-9 rounded-xl shadow-2xl w-full">
                      <h1 className="text-4xl mb-10 font-extrabold bg-gradient-to-r from-gray-100 to-gray-500 text-transparent bg-clip-text">
                        {book.volumeInfo.title}
                      </h1>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">By:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.authors?.join(", ")}
                          </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Publisher:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.publisher}
                          </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Category:</p>
                          {book.volumeInfo.categories.map((cat, i) => {
                            return (
                              <p
                                key={i}
                                className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer"
                              >
                                {cat}
                              </p>
                            );
                          })}
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Published Date:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.publishedDate}
                          </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Pages:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.pageCount} Page
                          </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Language:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.language}
                          </p>
                        </div>
                        <div className="flex gap-3 items-center">
                          <p className="font-bold">Type:</p>
                          <p className="text-xs font-semibold p-2 bg-black rounded-full bg-gradient-to-t from-blue-500 to-purple-500 text-white hover:font-semibold hover:scale-105 duration-500 cursor-pointer">
                            {book.volumeInfo.printType}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-16">
                      <h3 className="font-bold text-white my-4">
                        Book Description:
                      </h3>
                      <p className="text-lg max-w-4xl px-4 font-medium text-white">
                        {book.volumeInfo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
