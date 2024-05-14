import { useState } from 'react'
import ChatBot from 'react-chatbotify'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  let api_key = null;
	let has_error = false;

	// example gemini stream
	// you can replace with other LLMs or even have a simulated stream
	const gemini_stream = async (params) => {
		try {
			const genAI = new GoogleGenerativeAI(api_key);
			const model = genAI.getGenerativeModel({ model: "gemini-pro"});
			const result = await model.generateContentStream(params.userInput);

			let text = "";
			let offset = 0;
			for await (const chunk of result.stream) {
				const chunkText = chunk.text();
				text += chunkText;
				for (let i = offset; i < chunkText.length; i++) {
					// while this example shows params.streamMessage taking in text input,
					// you may also feed it custom JSX.Element if you wish
					await params.streamMessage(text.slice(0, i + 1));
					await new Promise(resolve => setTimeout(resolve, 30));
				}
				offset += chunkText.length;
			}

			// in case any remaining chunks are missed (e.g. timeout)
			// you may do your own nicer logic handling for large chunks
			for (let i = offset; i < text.length; i++) {
				await params.streamMessage(text.slice(0, i + 1));
				await new Promise(resolve => setTimeout(resolve, 30));
			}
			await params.streamMessage(text);
		} catch {
			await params.injectMessage("Unable to load model, is your API Key valid?");
			has_error = true;
		}
	}
	const flow={
		start: {
			message: "Enter your gemini api key and start asking away!",
			path: "api_key",
			isSensitive: true
		},
		api_key: {
			message: (params) => {
				api_key = params.userInput.trim();
				return "Ask me anything!";
			},
			path: "loop",
		},
		loop: {
			message: async (params) => {
				await gemini_stream(params);
			},
			path: () => {
				if (has_error) {
					return "start"
				}
				return "loop"
			}
		}
	}

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <ChatBot options={{theme: {embedded: true}, chatHistory: {storageKey: "example_real_time_stream"}, botBubble: {simStream: true}}} flow={flow}/>
    </>
  )
}

export default App
