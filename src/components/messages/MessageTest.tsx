import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  testUserFirestoreAccess, 
  testFirestoreConnection,
  getAvailableUsers,
  createConversation
} from '../../services/messages';
import { getAllUsers } from '../../services/users';

export function MessageTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }

    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Firestore connection
      addResult('🔍 Testing Firestore connection...');
      const connectionTest = await testFirestoreConnection();
      addResult(connectionTest ? '✅ Firestore connection successful' : '❌ Firestore connection failed');

      // Test 2: User Firestore access
      addResult('🔍 Testing user Firestore access...');
      const accessTest = await testUserFirestoreAccess(user.id);
      addResult(accessTest ? '✅ User Firestore access successful' : '❌ User Firestore access failed');

      // Test 3: Get all users
      addResult('🔍 Testing get all users...');
      const allUsers = await getAllUsers();
      addResult(`✅ Found ${allUsers.length} users`);

      // Test 4: Get available users
      addResult('🔍 Testing get available users...');
      const availableUsers = await getAvailableUsers(user.id);
      addResult(`✅ Found ${availableUsers.length} available users for conversation`);

      // Test 5: Create a test conversation (if there are available users)
      if (availableUsers.length > 0) {
        addResult('🔍 Testing conversation creation...');
        const testUser = availableUsers[0];
        const messageId = await createConversation(user.id, testUser.id, 'Test message from MessageTest component');
        addResult(`✅ Created test conversation with message ID: ${messageId}`);
      } else {
        addResult('⚠️ No available users to test conversation creation');
      }

    } catch (error) {
      addResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Message System Test</h2>
      
      <button
        onClick={runTests}
        disabled={isLoading || !user}
        className="mb-3 md:mb-4 px-3 md:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
      >
        {isLoading ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div className="space-y-1 md:space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="text-xs md:text-sm font-mono">
            {result}
          </div>
        ))}
      </div>

      {!user && (
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm md:text-base">Please log in to run tests</p>
        </div>
      )}
    </div>
  );
}
