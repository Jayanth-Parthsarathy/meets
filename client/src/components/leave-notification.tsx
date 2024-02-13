type Props = {
  leaverName: string;
};

const LeaveNotification = (props: Props) => {
  return (
    <div class="fixed bottom-0 left-0 mb-4 mr-4 bg-red-500 text-white p-4 rounded-md shadow-md">
      <p class="text-sm">{props.leaverName} left the meeting.</p>
    </div>
  );
};

export default LeaveNotification;
