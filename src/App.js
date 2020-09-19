import React, { useState, useEffect } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listComments } from './graphql/queries';
import { createComment as createCommentMutation, deleteComment as deleteCommentMutation } from './graphql/mutations';
import { API, Storage } from 'aws-amplify';

const initialFormState = { name: '', description: '' }

function App() {
  const [comments, setComments] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const apiData = await API.graphql({ query: listComments });
    const commentsFromAPI = apiData.data.listComments.items;
  await Promise.all(commentsFromAPI.map(async comment => {
    if (comment.image) {
      const image = await Storage.get(comment.image);
      comment.image = image;
    }
    return comment;
  }))
    setComments(apiData.data.listComments.items);
  }

  async function createComment() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createCommentMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }

    setComments([ ...comments, formData ]);
    setFormData(initialFormState);
  }

  async function deleteComment({ id }) {
    const newCommentsArray = comments.filter(comment => comment.id !== id);
    setComments(newCommentsArray);
    await API.graphql({ query: deleteCommentMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchComments();
  }

  return (
    <div className="App">
      <h1>Baby App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Post subject"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Post body"
        value={formData.description}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createComment}>Create Post</button>
      <div style={{marginBottom: 30}}>
        {
          comments.map(comment => (
            <div key={comment.id || comment.name}>
              <h2>{comment.name}</h2>
              <p>{comment.description}</p>
              {
                comment.image && <img src={comment.image} style={{width: 400, padding: 10}} />
              }
              <div><button onClick={() => deleteComment(comment)}>Delete Post</button></div>
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);