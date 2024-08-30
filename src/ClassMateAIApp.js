import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageCircle, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./components/ui/dialog";
import { useDropzone } from 'react-dropzone';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';

// Mock OpenAI Client
//Comment out or remove mock code once API_Key is available
class MockOpenAI {
    async chat() {
        return {
            completions: {
                create: async ({ model, messages }) => {
                    // Mock response logic
                    const lastUserMessage = messages[messages.length - 1].content;
                    return {
                        choices: [
                            { message: { content: `Mock response to: ${lastUserMessage}` } }
                        ]
                    };
                }
            }
        };
    }
}


// Initialize the OpenAI client (mock or real)
const openai = process.env.REACT_APP_OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    })
    : new MockOpenAI();

// Add this console log to check if the API key is being read correctly
console.log("API Key:", process.env.REACT_APP_OPENAI_API_KEY ? "API key is set" : "API key is not set");

const ClassMateAIApp = () => {
    const [classes, setClasses] = useState(['Math', 'History', 'Science']);
    const [documents, setDocuments] = useState({
        Math: [{ id: 1, name: 'Math Homework', content: 'Math content...' }],
        History: [{ id: 2, name: 'History Essay', content: 'History content...' }],
        Science: [{ id: 3, name: 'Lab Report', content: 'Science content...' }],
    });
    const [selectedClass, setSelectedClass] = useState('Math');
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [newDocumentName, setNewDocumentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatWidth, setChatWidth] = useState(320); // Initial width of chat sidebar
    const chatRef = useRef(null);
    const isDragging = useRef(false);

    const onDrop = useCallback(acceptedFiles => {
        setUploadedFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {'text/*': ['.txt', '.doc', '.docx', '.pdf']},
        multiple: false
    });

    const addClass = () => {
        const newClass = prompt('Enter new class name:');
        if (newClass && !classes.includes(newClass)) {
            setClasses([...classes, newClass]);
            setDocuments({...documents, [newClass]: []});
        }
    };

    const addDocument = () => {
        setIsUploadModalOpen(true);
    };

    const handleUpload = () => {
        if (uploadedFile && newDocumentName) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const newDoc = {
                    id: Date.now(),
                    name: newDocumentName,
                    content: content
                };
                setDocuments(prevDocs => ({
                    ...prevDocs,
                    [selectedClass]: [...prevDocs[selectedClass], newDoc]
                }));
                setIsUploadModalOpen(false);
                setUploadedFile(null);
                setNewDocumentName('');
            };
            reader.readAsText(uploadedFile);
        }
    };

    const removeDocument = (id) => {
        setDocuments(prevDocs => ({
            ...prevDocs,
            [selectedClass]: prevDocs[selectedClass].filter(doc => doc.id !== id)
        }));
    };

    const sendMessage = async () => {
        if (newMessage.trim()) {
            setChatMessages(prev => [...prev, { text: newMessage, sender: 'user' }]);
            setNewMessage('');
            setIsLoading(true);

            try {
                const context = documents[selectedClass].map(doc => `${doc.name}: ${doc.content}`).join('\n\n');
                const messages = [
                    { role: 'system', content: `You are a helpful AI assistant. Use the following context to answer questions:\n\n${context}` },
                    ...chatMessages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
                    { role: 'user', content: newMessage }
                ];

                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: messages,
                });

                const aiResponse = completion.choices[0].message.content;
                setChatMessages(prev => [...prev, { text: aiResponse, sender: 'ai' }]);
            } catch (error) {
                console.error('Error querying AI:', error);
                setChatMessages(prev => [...prev, { text: 'Sorry, I encountered an error: ' + error.message, sender: 'ai' }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const startResize = (e) => {
        isDragging.current = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    };

    const resize = (e) => {
        if (isDragging.current) {
            const newWidth = document.body.clientWidth - e.clientX;
            setChatWidth(Math.max(200, Math.min(600, newWidth))); // Min 200px, max 600px
        }
    };

    const stopResize = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };
    }, []);

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-800 p-4">
                <h2 className="text-xl font-bold mb-4">Your Classes</h2>
                <ul>
                    {classes.map((cls, index) => (
                        <li
                            key={index}
                            className={`cursor-pointer p-2 rounded ${selectedClass === cls ? 'bg-gray-700' : ''}`}
                            onClick={() => setSelectedClass(cls)}
                        >
                            {cls}
                        </li>
                    ))}
                </ul>
                <Button onClick={addClass} className="mt-4 w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 overflow-auto">
                <h1 className="text-2xl font-bold mb-4">Documents for {selectedClass}</h1>
                <div className="grid grid-cols-3 gap-4">
                    {documents[selectedClass].map(doc => (
                        <Card key={doc.id} className="bg-gray-800">
                            <CardHeader>
                                <CardTitle>{doc.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={() => removeDocument(doc.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    <Card className="bg-gray-800 flex items-center justify-center cursor-pointer" onClick={addDocument}>
                        <UploadCloud className="h-12 w-12" />
                        <p className="mt-2">Upload Document</p>
                    </Card>
                </div>
            </div>

            {/* Resizable Chat Sidebar */}
            <div
                ref={chatRef}
                className="bg-gray-800 flex flex-col relative"
                style={{ width: `${chatWidth}px`, minWidth: '200px', maxWidth: '600px' }}
            >
                <div
                    className="w-1 bg-gray-600 cursor-col-resize absolute left-0 top-0 bottom-0"
                    onMouseDown={startResize}
                ></div>
                <h2 className="text-xl font-bold mb-4 p-4">AI Chat</h2>
                <div className="flex-1 overflow-y-auto mb-4 bg-gray-700 rounded p-2 mx-4">
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 rounded max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                <ReactMarkdown className="text-white text-sm">
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask a question..."
                        className="mb-2 text-black"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={isLoading} className="w-full">
                        {isLoading ? 'Thinking...' : <MessageCircle className="mr-2 h-4 w-4" />}
                        {isLoading ? '' : 'Send'}
                    </Button>
                </div>
            </div>

            {/* Upload Document Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-black">Upload Document</DialogTitle>
                    </DialogHeader>
                    <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        <input {...getInputProps()} />
                        {
                            isDragActive ?
                                <p className="text-black">Drop the file here ...</p> :
                                <p className="text-black">Drag 'n' drop a file here, or click to select a file</p>
                        }
                    </div>
                    {uploadedFile && <p className="mt-2 text-black">File: {uploadedFile.name}</p>}
                    <Input
                        value={newDocumentName}
                        onChange={(e) => setNewDocumentName(e.target.value)}
                        placeholder="Enter document name"
                        className="mt-4 text-black"
                    />
                    <DialogFooter>
                        <Button onClick={handleUpload} disabled={!uploadedFile || !newDocumentName}>
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClassMateAIApp;