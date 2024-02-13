type Props = {
  newUserName: string;
};

const JoinNotification = (props: Props) => {
  return (
    <div class="fixed bottom-0 right-0 mb-4 mr-4 bg-green-500 text-white p-4 rounded-md shadow-md">
      <p class="text-sm">{props.newUserName} joined the meeting.</p>
    </div>
  );
};

export default JoinNotification;
