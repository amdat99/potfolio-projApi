BEGIN TRANSACTION;

INSERT INTO messages (messageid,name,message,userid,likes,image,date) values ( 123, 'john', 'hello', 'a123',1,'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260','2021-03-03');

COMMIT; 