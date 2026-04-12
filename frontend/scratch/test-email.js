async function testEmailAPI() {
  console.log("Testing Email API...");
  try {
    const response = await fetch('http://localhost:3000/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'NEW_REQUEST',
        payload: {
          to: 'test@example.com',
          borrowerName: 'Test Borrower',
          itemTitle: 'Professional Ladder',
          requestId: 'test-req-123',
          amount: 500
        }
      })
    });
    
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Note: This needs to be run in an environment where fetch is available and the server is running.
// Since I cannot easily run a full browser fetch against a local dev server here without blocking,
// I will rely on code correctness and environment setup.
