import React, {Suspense, useEffect, useRef, useState} from "react";
import PropTypes from "prop-types";

import bear from "../../assets/gamerIcons/bear.png";
import blueGuy from "../../assets/gamerIcons/blueGuy.png";
import curlyGirl from "../../assets/gamerIcons/curlyGirl.png";
import dragon from "../../assets/gamerIcons/Dragon.png";
import greenGuy from "../../assets/gamerIcons/greenGuy.png";
import purpleGirl from "../../assets/gamerIcons/purpleGirl.png";
import redGirl from "../../assets/gamerIcons/redGirl.png";
import redGuy from "../../assets/gamerIcons/redGuy.png";
import wolf from "../../assets/gamerIcons/Wolf.png";
import money from "../../assets/Money.png";
import "../../styles/UserBar.css"
import {useFetch} from "../../personalHooks/useFetch";
import { io } from 'socket.io-client';


export const UserBar = ({userNickname}) => {
    const [balance, setBalance] = useState(5000);
    const [updateUser, setUpdateUser] = useState(false);
    const [userFound, setUserFound] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    /**
    const userSocket = io('https://thehiddencargo1.azure-api.net/creation/balance', {
        extraHeaders: {
            'Ocp-Apim-Subscription-Key': 'b553314cb92447a6bb13871a44b16726'
        }
    });
    **/
    const {data, loading, status, error} = useFetch(
        {
            url: `https://thehiddencargo1.azure-api.net/creation/users/${userNickname}/info`,
            method: 'GET',
            headers: {
                'accept': '*/*'
            }
        }, [userNickname], userNickname || updateUser);

    /**
    useEffect(() => {
        userSocket.on('connect', () => setIsConnected(true));

        userSocket.on('transactions/made/' + userNickname, (currentBalance) => {
            setBalance(currentBalance);
        });

        return () => {
            userSocket.off('connect');
            userSocket.off('transactions/made');
        };
    }, []);
        **/

    useEffect(() => {
        console.log("get info")
        console.log(data, loading,status,userNickname,error);
        if (!loading && status === 200)  setUserFound(true);
    }, [loading,status]);

    const handleUpdate = () =>{
        setUpdateUser(true);
        return <UserDialog toCreate={false} currentNickname={data.nickName}/>;
    }


    return (
        <>
        {userFound ?
            <>
            <div className="user-info">
                <div className="icon">
                    <button onClick={handleUpdate}>
                        <img className="icon" src={data.photo} alt="User Icon"/>
                    </button>
                </div>
                <div id="Bienvenida">
                    <h1>Hola, {data.nickName}</h1>
                    <p className="lobby-subtitle">Bienvenido a The Hidden Cargo</p>
                </div>
                <div id="balance">
                    <p>${balance}</p>
                </div>
            </div>
            </>
            : <div className="user-info"><h2>Usuario No encontrado</h2></div>
        }
        </>
    );

};

UserBar.propTypes = {
    userNickname: PropTypes.string
};

const UserDialog = ({toCreate,currentNickname, email,updateNickname}) => {
    const [newNickname, setNewNickname] = useState(currentNickname);
    const [icon, setIcon] = useState(null);
    const[title, setTitle] = useState(null);
    const[submitButton, setSubmitButton]= useState(null);
    const [createUser, setCreateUser] = useState(false);
    const [updateUser, setUpdateUser] = useState(false);
    const dialogRef = useRef(null);
    /*Fetch to register User*/
    const {loading:loadingCreate, status:statusCreate, error: errorCreate} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/users/register',
        method: 'POST',
        body: {
            email: email,
            nickName: newNickname,
            balance : "5000",
            icon : icon
        }
    },[createUser],createUser);

    /*Fetch GET Information*/
    const {data:userData, loading:userLoading, status:userStatus, error:userError} = useFetch(
        {
            url: "https://thehiddencargo1.azure-api.net/creation/users/" + currentNickname + "/info",
            method: 'GET',
            headers: {
                'accept': '*/*'
            }
        }, [], !toCreate);

    /*Fetch to update NickName*/
    const {loading:nickLoading, status:nickStatus, error:nickError} = useFetch(
        {
            url: `http://localhost:8080/users/update/nickname/${currentNickname}` ,
            method: 'PUT',
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: {
                "newNickName": newNickname
            }},[updateUser],updateUser);

    /*Fetch to update icon*/
    const {loading:iconLoading, status:iconStatus, error:iconEror} = useFetch(
        {
            url: `http://localhost:8080/users/update/photo/${currentNickname}` ,
            method: 'PUT',
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: {
                "photo": icon
            }},[updateUser],updateUser);

    /*Icons definition*/
    const icons = [
        blueGuy,
        greenGuy,
        redGuy,
        curlyGirl,
        purpleGirl,
        redGirl,
        wolf,
        dragon,
        bear
    ];

    const handleClose = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };

    const handleSubmit = (e) => {
           e.preventDefault();
           if(toCreate) setCreateUser(true);
           else setUpdateUser(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Previene la acción de la tecla de espacio
        }
    };

    useEffect(() => {
        if (dialogRef) {
            if(toCreate){
                setTitle("Creación de Usuario");
                setSubmitButton("Crear");
            }else{
                setTitle(`Actualizando a: ${currentNickname}`);
                setSubmitButton("Actualizar");
            }
            dialogRef.current.showModal();
            const handleCancel = (event) => {
                event.preventDefault();
            };
            dialogRef.current.addEventListener('cancel', handleCancel);

            return () => {
                dialogRef.current.removeEventListener('cancel', handleCancel);
            };
        }
    }, []);
    /*Handle Create*/
    useEffect(() => {
        console.log("Creating")
        console.log(loadingCreate,statusCreate,createUser);
        if(loadingCreate === false && createUser && statusCreate === 201){
            updateNickname(newNickname);
            handleClose();
        }
        if(loadingCreate === false && createUser && statusCreate === 400) {
            setNewNickname(null);
            setCreateUser(false);
            setIcon(null);
        }
    }, [loadingCreate,statusCreate]);

    /*Handle GET*/
    useEffect(() => {
        console.log("GETTING");
        console.log(userData,userLoading,userStatus);
        if(!toCreate && !userLoading && userStatus === 200 && (!updateUser || !createUser) ){
            setNewNickname(userData.nickName);
            setIcon(userData.photo);
        }}, [userLoading,userData]);

    /*Handle Update*/
    useEffect(() => {
        console.log("UPDATING");
        console.log(nickLoading,iconLoading, nickStatus, iconStatus);
        if(!nickLoading && !iconLoading && nickStatus === 200 && iconStatus === 200) window.location.reload();
        else{
            if(!nickLoading &&  nickStatus === 400) {
                setNewNickname(currentNickname);
            }
            if(!iconLoading &&  iconStatus === 400) {
                setIcon(userData.photo);
            }
        }
        if(!nickLoading && !iconLoading)handleClose();
    }, [nickLoading,iconLoading,nickStatus,iconStatus]);

  return(
      <dialog className="user-creation" ref={dialogRef}>
          <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
            <input
            type="text"
            placeholder={currentNickname}
            onChange={(e)=>{setNewNickname(e.target.value)}}
            onKeyDown={handleKeyDown}
            maxLength="12"
            />

            <div className="select-icons">
                {icons.map((iconMap,index) => (
                    <div className={`icon-container ${icon === iconMap ? 'selected' : ''}`}
                         key={index} onClick={(() => setIcon(iconMap))}>
                        <img
                            src={iconMap}
                            alt={index}
                        />
                    </div>

                ))}
            </div>
            <div className="buttons">
            <input
                type="submit"
                value={submitButton}
                disabled={!icon || !newNickname}
            />
                {toCreate ? null : <button onClick={handleClose}>Cancel</button>}
            </div>
        </form>
          {statusCreate !== 201 && <h2>{errorCreate}</h2>}
      </dialog>



  );
};

UserDialog.propTypes = {
    toCreate : PropTypes.bool.isRequired,
    currentNickname: PropTypes.string,
    email: PropTypes.string,
    updateNickname : PropTypes.func
};
export  default  UserBar;
export {UserDialog};