import React, { useState } from 'react';
import { MessageCircle, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

const ClassMateAIApp = () => {
    const [classes, setClasses] = useState(['Math', 'History', 'Science']);
    const [documents, setDocuments] = useState([
        { id: 1, name: 'Math Homework', class: 'Math' },
        { id: 2, name: 'History Essay', class: 'History' },
        { id: 3, name: 'Lab Report', class: 'Science' },
    ]);
    const [selectedClass, setSelectedClass] = useState('Math');
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const addClass = () => {
        const newClass = prompt('Enter new class name:');
        if (newClass) setClasses([...classes, newClass]);
    };

    const addDocument = () => {
        const newDoc = { id: documents.length + 1, name: 'New Document', class: selectedClass };
        setDocuments([...documents, newDoc]);
    };

    const removeDocument = (id) => {
        setDocuments(documents.filter(doc => doc.id !== id));
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            setChatMessages([...chatMessages, { text: newMessage, sender: 'user' }]);
            setNewMessage('');
            // Here you would typically call an AI API to get a response
            setTimeout(() => {
                setChatMessages(prev => [...prev, { text: 'AI response placeholder', sender: 'ai' }]);
            }, 1000);
        }
    };

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
            <div className="flex-1 p-4">
                <h1 className="text-2xl font-bold mb-4">Documents for {selectedClass}</h1>
                <div className="grid grid-cols-3 gap-4">
                    {documents.filter(doc => doc.class === selectedClass).map(doc => (
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

            {/* Right Sidebar - Chat */}
            <div className="w-80 bg-gray-800 p-4">
                <h2 className="text-xl font-bold mb-4">AI Chat</h2>
                <div className="h-[calc(100vh-200px)] overflow-y-auto mb-4 bg-gray-700 rounded p-2">
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                {msg.text}
              </span>
                        </div>
                    ))}
                </div>
                <div className="flex">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 mr-2"
                    />
                    <Button onClick={sendMessage}>
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClassMateAIApp;