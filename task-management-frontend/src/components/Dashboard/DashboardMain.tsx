import { TaskForm } from '../../components/TaskForm';
import { TaskList } from '../../components/TaskList';

function DashboardMain({ activeTab, refreshKey, onTaskCreated, onEntriesCountChange }:any) {
  return (
    <main className="main-content">
      {activeTab === 'add' ? (
        <div className="form-section">
          <TaskForm onSuccess={onTaskCreated} />
        </div>
      ) : (
        <div className="list-section">
          <TaskList refresh={refreshKey} onCountChange={onEntriesCountChange} />
        </div>
      )}
    </main>
  );
}

export default DashboardMain;
