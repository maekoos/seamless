import { useState } from "react";
import { functions, useSession } from "./api";

function App() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession();

  console.log("Session:", session);

  const onSubmit = async e => {
    e.preventDefault();

    setIsLoading(true);
    const res = await functions.setSession({ value: inputValue, });
    console.log("Res:", res);
    setIsLoading(false);
    setInputValue('');
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input
          value={inputValue}
          onChange={ev => setInputValue(ev.target.value)}
          placeholder="Session value"
          disabled={isLoading} />

        <button type="submit" disabled={isLoading}>Submit</button>
      </form>

      <p>Current session value:</p>
      <p>{JSON.stringify(session)}</p>
    </div>
  );
}

export default App;
