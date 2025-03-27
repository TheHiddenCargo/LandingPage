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
import "../../styles/UserBar.css"
import {fetchData} from "../../personalHooks/fetchData";
import {useFetch} from "../../personalHooks/useFetch";



export const UserBar = ({nickname}) => {
    return(
        <div className="user-content">
            <div id="balance">
                <p>Balance</p>
            </div>
            <div className="info">
                <img src={"../assets/gamerIcons/Dragon.png"}/>
                <p>{nickname}</p>
            </div>

        </div>
    );
};

UserBar.propTypes = {
    nickName: PropTypes.string.isRequired
};

const UserCreation = ({currentNickname,setNickname, email,openDialog}) =>{
    const [icon,setIcon] = useState(null);
    const [sendUser,setSendUser] = useState(false);
    const [isOpen,setIsOpen] = useState(openDialog);
    const dialogRef = useRef(null);

    let {loading,status} = useFetch({
        url: 'https://thehiddencargo1.azure-api.net/creation/users/register',
        method: 'POST',
        body: {
            email: email,
            nickName: currentNickname,
            balance : "5000",
            icon : icon
        }
    },[sendUser],sendUser === true);

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
        setIsOpen(false);
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };


    const handleSubmit = (e) => {
           e.preventDefault();
           console.log("Sumbit");
           setSendUser(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault(); // Previene la acción de la tecla de espacio
        }
    };

    useEffect(() => {
        if (isOpen && dialogRef) {
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

    useEffect(() => {
        console.log(loading,status,sendUser);
        if(loading === false && sendUser && status === 201) handleClose();
        if(loading === false && sendUser && status === 400) {
            setNickname(null);
            setSendUser(false);
            setIcon(null);
        }
    }, [loading,status,sendUser]);

  return(
      <dialog className="user-creation" ref={dialogRef}>
          <h2>Creación de Usuario</h2>
        <form onSubmit={handleSubmit}>
            <input
            type="text"
            placeholder={currentNickname}
            onChange={(e)=>{setNickname(e.target.value)}}
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

            <input
                type="submit"
                value="Crear Usuario"
                disabled={!icon || !currentNickname}
            />
        </form>
          {status !== 201 && <h2>{status}</h2>}
      </dialog>


  );
};

UserCreation.propTypes = {
    currentNickname: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    openDialog : PropTypes.bool.isRequired,
    setNickname : PropTypes.func.isRequired
};
export  default  UserBar;
export {UserCreation};